-- Fix signup by disabling problematic triggers
-- These triggers are causing 500 errors during signup due to RLS policy conflicts

-- Disable the triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_default_quick_add_buttons_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;

-- Drop the functions (optional - you can keep them if you want to recreate triggers later)
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_default_quick_add_buttons();
DROP FUNCTION IF EXISTS initialize_user_credits();
DROP FUNCTION IF EXISTS create_free_subscription();

-- Verify no triggers remain
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
