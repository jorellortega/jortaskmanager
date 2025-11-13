-- Add role column to public.users table
-- This migration adds a role column to support admin access control

-- Add the role column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Add a check constraint to ensure role is one of the valid values
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

-- Create an index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Update existing users to have 'user' role if they don't have one
-- (This is handled by the DEFAULT, but we'll ensure it explicitly)
UPDATE public.users
SET role = 'user'
WHERE role IS NULL;

-- Optional: Set a specific user as admin (replace with your admin email)
-- UPDATE public.users
-- SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';

-- Add comment to the column
COMMENT ON COLUMN public.users.role IS 'User role: user (default) or admin';

