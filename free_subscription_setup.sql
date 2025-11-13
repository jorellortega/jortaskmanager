-- Function to create a free subscription for new users
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a free subscription record for new users
  INSERT INTO user_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    subscription_status,
    plan_name,
    plan_type,
    billing_cycle,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    NULL, -- No Stripe customer ID for free users
    NULL, -- No Stripe subscription ID for free users
    'free_plan', -- Custom price ID for free plan
    'active', -- Free users are considered "active"
    'Free Plan',
    'free',
    'monthly', -- Free plan is monthly
    NOW(), -- Start period now
    NOW() + INTERVAL '1 month' -- End period in 1 month (will be renewed automatically)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create free subscription when user signs up
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;
CREATE TRIGGER create_free_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription();

-- Also create a function to renew free subscriptions (run this periodically)
CREATE OR REPLACE FUNCTION renew_free_subscriptions()
RETURNS VOID AS $$
BEGIN
  -- Renew free subscriptions that have expired
  UPDATE user_subscriptions 
  SET 
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE 
    plan_type = 'free' 
    AND subscription_status = 'active'
    AND current_period_end < NOW();
END;
$$ LANGUAGE plpgsql;
