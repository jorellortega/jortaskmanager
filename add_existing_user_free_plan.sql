-- Add free subscription for existing user
-- Replace 'c041d56b-d473-43d3-93b1-3f8e43306b0f' with your actual user ID if different

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
  'c041d56b-d473-43d3-93b1-3f8e43306b0f', -- Your user ID from the logs
  NULL, -- No Stripe customer ID for free users
  NULL, -- No Stripe subscription ID for free users
  'free_plan', -- Custom price ID for free plan
  'active', -- Free users are considered "active"
  'Free Plan',
  'free',
  'monthly', -- Free plan is monthly
  NOW(), -- Start period now
  NOW() + INTERVAL '1 month' -- End period in 1 month
);
