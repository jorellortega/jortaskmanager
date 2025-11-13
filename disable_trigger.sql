-- Temporarily disable the trigger to fix signup issues
DROP TRIGGER IF EXISTS create_free_subscription_trigger ON auth.users;
