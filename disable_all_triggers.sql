-- Disable ALL triggers that might be causing signup issues
DROP TRIGGER IF EXISTS create_default_quick_add_buttons_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;

-- Also drop the functions if they exist
DROP FUNCTION IF EXISTS create_default_quick_add_buttons();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS initialize_user_credits();
DROP FUNCTION IF EXISTS create_free_subscription();
