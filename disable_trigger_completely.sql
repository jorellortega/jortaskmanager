-- Completely disable the trigger and function
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_free_subscription();

-- Also check if there are any other triggers on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
