-- Create function to create a free subscription for new users with debugging
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Trigger create_free_subscription called for user_id: %', NEW.id;
  
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
    
    RAISE LOG 'Successfully created free subscription for user_id: %', NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE LOG 'Error creating free subscription for user_id %: %', NEW.id, SQLERRM;
      -- Don't re-raise the exception to avoid blocking user creation
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create free subscription when user signs up
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;
CREATE TRIGGER create_free_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription();

-- Enable logging to see the debug messages
SET log_statement = 'all';
SET log_min_messages = 'log';
