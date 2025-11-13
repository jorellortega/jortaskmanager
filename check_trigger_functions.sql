-- Check the functions that are being called by the triggers
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'create_default_quick_add_buttons',
    'initialize_user_credits', 
    'handle_new_user'
);

-- Also check if any of these functions reference user_subscriptions table
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition LIKE '%user_subscriptions%';
