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

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Checkout session API called')
    const { priceId, type, credits } = await request.json();
    console.log('📦 Request data:', { type, priceId, credits })
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ No authorization header')
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Get user from Supabase using the session token
    console.log('👤 Getting user from Supabase...')
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('👤 User result:', user?.id, 'Error:', authError)
    if (authError || !user) {
      console.log('❌ Invalid user or auth error')
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }

    // Get or create Stripe customer
    let customerId: string;
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
      console.log('👤 Using existing Stripe customer:', customerId);
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      console.log('🆕 Created new Stripe customer:', customerId);

      // Update user subscription record with customer ID
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        }, {
          onConflict: 'user_id'
        });
    }

    // Get base URL from environment variable or default to localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000');

    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (type === 'subscription') {
      // Validate price ID
      if (!priceId || priceId.trim() === '') {
        return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
      }

      // Create subscription checkout session
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/billing/plans`,
        metadata: {
          userId: user.id,
          type: 'subscription',
        },
      };
    } else if (type === 'credits') {
      // Validate credits
      if (!credits || credits <= 0) {
        return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
      }

      // Create one-time payment for credits
      sessionConfig = {
        mode: 'payment',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${credits} API Credits`,
                description: `Purchase ${credits} credits for API usage`,
              },
              unit_amount: Math.round(credits * 0.01 * 100), // $0.01 per credit
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/credits/purchase`,
        metadata: {
          userId: user.id,
          type: 'credits',
          credits: credits.toString(),
        },
      };
    } else {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Checkout session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    
    // Provide more specific error messages
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ 
        error: error.message || 'Invalid request to Stripe' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
