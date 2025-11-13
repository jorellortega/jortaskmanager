-- Temporarily disable the credits trigger to test signup
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
