-- Add debug logging to trigger functions to see what's failing
-- This will help us identify the exact issue without changing functionality

-- 1. Add debug logging to handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
BEGIN
  RAISE LOG 'DEBUG: handle_new_user triggered for user_id: %', NEW.id;
  
  meta := NEW.raw_user_meta_data;
  RAISE LOG 'DEBUG: User meta data: %', meta;
  
  BEGIN
    INSERT INTO public.users (id, email, name, phone, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(meta->>'name', NULL),
      COALESCE(meta->>'phone', NULL),
      NOW()
    );
    RAISE LOG 'DEBUG: Successfully inserted into public.users for user_id: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'DEBUG: Error inserting into public.users for user_id %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add debug logging to create_default_quick_add_buttons function
CREATE OR REPLACE FUNCTION create_default_quick_add_buttons()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG 'DEBUG: create_default_quick_add_buttons triggered for user_id: %', NEW.id;
  
  BEGIN
    INSERT INTO quick_add_buttons (user_id, name, category, icon, color, priority, sort_order) VALUES
      (NEW.id, 'Todo', 'todo', 'Plus', 'purple', 'medium', 1),
      (NEW.id, 'Work Task', 'work', 'Briefcase', 'blue', 'medium', 2),
      (NEW.id, 'Self Development', 'selfdev', 'Target', 'yellow', 'medium', 3),
      (NEW.id, 'Leisure Activity', 'leisure', 'Utensils', 'green', 'low', 4),
      (NEW.id, 'Fitness Activity', 'fitness', 'Dumbbell', 'purple', 'medium', 5),
      (NEW.id, 'Appointment', 'appointment', 'Clock', 'green', 'high', 6);
    RAISE LOG 'DEBUG: Successfully inserted quick_add_buttons for user_id: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'DEBUG: Error inserting quick_add_buttons for user_id %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add debug logging to initialize_user_credits function
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG 'DEBUG: initialize_user_credits triggered for user_id: %', NEW.id;
  
  BEGIN
    INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
    VALUES (NEW.id, 100, 100, 0);
    RAISE LOG 'DEBUG: Successfully inserted user_credits for user_id: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'DEBUG: Error inserting user_credits for user_id %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Add debug logging to create_free_subscription function
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG 'DEBUG: create_free_subscription triggered for user_id: %', NEW.id;
  
  BEGIN
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
    RAISE LOG 'DEBUG: Successfully inserted user_subscriptions for user_id: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'DEBUG: Error inserting user_subscriptions for user_id %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
