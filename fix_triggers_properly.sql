-- Fix the triggers to work properly instead of disabling them
-- The issue is RLS policies blocking the new user during signup

-- 1. Fix the handle_new_user function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
BEGIN
  meta := NEW.raw_user_meta_data;
  
  -- Use SECURITY DEFINER to bypass RLS
  INSERT INTO public.users (id, email, name, phone, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(meta->>'name', NULL),
    COALESCE(meta->>'phone', NULL),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix the create_default_quick_add_buttons function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_default_quick_add_buttons()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS
  INSERT INTO quick_add_buttons (user_id, name, category, icon, color, priority, sort_order) VALUES
    (NEW.id, 'Todo', 'todo', 'Plus', 'purple', 'medium', 1),
    (NEW.id, 'Work Task', 'work', 'Briefcase', 'blue', 'medium', 2),
    (NEW.id, 'Self Development', 'selfdev', 'Target', 'yellow', 'medium', 3),
    (NEW.id, 'Leisure Activity', 'leisure', 'Utensils', 'green', 'low', 4),
    (NEW.id, 'Fitness Activity', 'fitness', 'Dumbbell', 'purple', 'medium', 5),
    (NEW.id, 'Appointment', 'appointment', 'Clock', 'green', 'high', 6);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the initialize_user_credits function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS
  INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
  VALUES (NEW.id, 100, 100, 0); -- Give new users 100 free credits
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix the create_free_subscription function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS
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
    NULL, 
    NULL, 
    'free_plan', 
    'active', 
    'Free Plan', 
    'free', 
    'monthly', 
    NOW(), 
    NOW() + INTERVAL '1 month'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_default_quick_add_buttons_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER create_default_quick_add_buttons_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_quick_add_buttons();

CREATE TRIGGER initialize_user_credits_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();

CREATE TRIGGER create_free_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription();
