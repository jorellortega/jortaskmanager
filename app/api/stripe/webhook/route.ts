import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received');
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    console.log('📝 Webhook body length:', body.length);
    console.log('🔐 Webhook signature present:', !!signature);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified, event type:', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const type = session.metadata?.type;
  const credits = session.metadata?.credits;

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  console.log('✅ Checkout session completed:', session.id, 'Type:', type);

  // Record payment in payment_history
  await supabase.from('payment_history').insert({
    user_id: userId,
    stripe_payment_intent_id: session.payment_intent as string,
    stripe_customer_id: session.customer as string,
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    payment_type: type === 'subscription' ? 'subscription' : 'credits',
    status: 'succeeded',
    description: session.description || `Payment for ${type}`,
    metadata: session.metadata,
  });

  if (type === 'subscription' && session.subscription) {
    // Retrieve the subscription from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      console.log('📋 Retrieved subscription:', subscription.id);
      
      // Update user subscription using the same handler
      await handleSubscriptionUpdated(subscription);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
    }
  } else if (type === 'credits' && credits) {
    // Add credits to user account
    const { error: creditError } = await supabase.rpc('add_user_credits', {
      user_id: userId,
      credits: parseInt(credits),
      description: `Purchased ${credits} credits`
    });

    if (creditError) {
      console.error('Error adding credits:', creditError);
    } else {
      console.log('✅ Added credits to user account');
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Handling subscription update:', subscription.id);
  const customerId = subscription.customer as string;
  
  console.log('👤 Customer ID:', customerId);
  console.log('📊 Subscription status:', subscription.status);
  
  // Get user by customer ID
  const { data: userSub, error: subError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  console.log('🔍 User subscription lookup result:', { userSub, subError });

  if (subError || !userSub) {
    console.error('❌ User not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planName = getPlanName(priceId);
  const planType = getPlanType(priceId);

  // Upsert subscription
  const { error: upsertError } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userSub.user_id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_status: subscription.status,
      plan_name: planName,
      plan_type: planType,
      billing_cycle: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    });

  if (upsertError) {
    console.error('Error upserting subscription:', upsertError);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({ subscription_status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payment
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment
  console.log('Payment failed for invoice:', invoice.id);
}

function getPlanName(priceId: string): string {
  // Map price IDs to plan names
  const planMap: Record<string, string> = {
    'price_1SLZFH6jTRzt8LDZNEOT6oFB': 'Basic Monthly ($3.25)',
    'price_basic_monthly': 'Basic Monthly',
    'price_basic_yearly': 'Basic Yearly',
    'price_premium_monthly': 'Premium Monthly',
    'price_premium_yearly': 'Premium Yearly',
    'price_enterprise_monthly': 'Enterprise Monthly',
    'price_enterprise_yearly': 'Enterprise Yearly',
  };
  return planMap[priceId] || 'Unknown Plan';
}

function getPlanType(priceId: string): string {
  // Map price IDs to plan types
  const typeMap: Record<string, string> = {
    'price_1SLZFH6jTRzt8LDZNEOT6oFB': 'basic',
    'price_basic_monthly': 'basic',
    'price_basic_yearly': 'basic',
    'price_premium_monthly': 'premium',
    'price_premium_yearly': 'premium',
    'price_enterprise_monthly': 'enterprise',
    'price_enterprise_yearly': 'enterprise',
  };
  return typeMap[priceId] || 'free';
}
