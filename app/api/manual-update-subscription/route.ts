import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, stripeCustomerId, stripeSubscriptionId, priceId } = await request.json();
    
    console.log('🔧 Manual subscription update:', { userId, stripeCustomerId, stripeSubscriptionId, priceId });
    
    // First, try to find existing subscription
    const { data: existingSub, error: findError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔍 Existing subscription:', existingSub);

    if (existingSub) {
      // Update existing subscription
      console.log('📝 Updating existing subscription...');
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_price_id: priceId,
          subscription_status: 'active',
          plan_name: 'Basic Monthly ($3.25)',
          plan_type: 'basic',
          billing_cycle: 'monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Insert new subscription
      console.log('➕ Creating new subscription...');
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_price_id: priceId,
          subscription_status: 'active',
          plan_name: 'Basic Monthly ($3.25)',
          plan_type: 'basic',
          billing_cycle: 'monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) {
        console.error('❌ Error creating subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    console.log('✅ Subscription updated successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Manual update error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
