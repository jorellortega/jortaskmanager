-- Create function to add credits to user account
CREATE OR REPLACE FUNCTION add_user_credits(
  user_id UUID,
  credits INTEGER,
  description TEXT DEFAULT 'Credits added'
)
RETURNS VOID AS $$
BEGIN
  -- Update user credits balance
  UPDATE user_credits 
  SET 
    balance = balance + credits,
    total_purchased = total_purchased + credits,
    updated_at = NOW()
  WHERE user_credits.user_id = add_user_credits.user_id;

  -- If no row exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
    VALUES (add_user_credits.user_id, credits, credits, 0);
  END IF;

  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    add_user_credits.user_id,
    'purchase',
    credits,
    add_user_credits.description
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to deduct credits from user account
CREATE OR REPLACE FUNCTION deduct_user_credits(
  user_id UUID,
  credits INTEGER,
  description TEXT DEFAULT 'Credits used'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM user_credits
  WHERE user_credits.user_id = deduct_user_credits.user_id;

  -- Check if user has enough credits
  IF current_balance IS NULL OR current_balance < credits THEN
    RETURN FALSE;
  END IF;

  -- Update user credits balance
  UPDATE user_credits 
  SET 
    balance = balance - credits,
    total_used = total_used + credits,
    updated_at = NOW()
  WHERE user_credits.user_id = deduct_user_credits.user_id;

  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    deduct_user_credits.user_id,
    'usage',
    -credits,
    deduct_user_credits.description
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID)
RETURNS TABLE (
  plan_type TEXT,
  subscription_status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.plan_type,
    us.subscription_status,
    us.current_period_end,
    us.cancel_at_period_end
  FROM user_subscriptions us
  WHERE us.user_id = get_user_subscription_status.user_id
  AND us.subscription_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subscription_count
  FROM user_subscriptions
  WHERE user_subscriptions.user_id = has_active_subscription.user_id
  AND subscription_status IN ('active', 'trialing');
  
  RETURN subscription_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user credits balance
CREATE OR REPLACE FUNCTION get_user_credits_balance(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  credits_balance INTEGER;
BEGIN
  SELECT balance INTO credits_balance
  FROM user_credits
  WHERE user_credits.user_id = get_user_credits_balance.user_id;
  
  RETURN COALESCE(credits_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can use API (has credits or active subscription)
CREATE OR REPLACE FUNCTION can_use_api(user_id UUID, required_credits INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  has_subscription BOOLEAN;
  credits_balance INTEGER;
BEGIN
  -- Check if user has active subscription
  SELECT has_active_subscription(user_id) INTO has_subscription;
  
  IF has_subscription THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has enough credits
  SELECT get_user_credits_balance(user_id) INTO credits_balance;
  
  RETURN credits_balance >= required_credits;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user usage limits based on subscription
CREATE OR REPLACE FUNCTION get_user_usage_limits(user_id UUID)
RETURNS TABLE (
  max_tasks_per_week INTEGER,
  max_api_calls_per_month INTEGER,
  max_storage_mb INTEGER
) AS $$
DECLARE
  user_plan TEXT;
BEGIN
  -- Get user's current plan
  SELECT plan_type INTO user_plan
  FROM user_subscriptions
  WHERE user_subscriptions.user_id = get_user_usage_limits.user_id
  AND subscription_status IN ('active', 'trialing');
  
  -- Return limits based on plan
  CASE user_plan
    WHEN 'free' THEN
      RETURN QUERY SELECT 10, 100, 10;
    WHEN 'basic' THEN
      RETURN QUERY SELECT 1000, 1000, 100;
    WHEN 'premium' THEN
      RETURN QUERY SELECT 5000, 5000, 500;
    WHEN 'enterprise' THEN
      RETURN QUERY SELECT 50000, 50000, 5000;
    ELSE
      -- Default to free plan limits
      RETURN QUERY SELECT 10, 100, 10;
  END CASE;
END;
$$ LANGUAGE plpgsql;
