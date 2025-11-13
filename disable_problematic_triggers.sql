-- Disable only the problematic triggers, keep the auth trigger
-- This will fix signup while keeping user creation working

DROP TRIGGER IF EXISTS create_default_quick_add_buttons_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;

-- Keep the auth trigger (on_auth_user_created) - this is important for user creation
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- DON'T DROP THIS ONE

-- Verify which triggers remain
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
