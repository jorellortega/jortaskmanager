-- Ensure users can read their own role from public.users table
-- This is needed for the useAuth hook to work

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Create policy to allow users to view their own data (including role)
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Optional: Allow users to update their own name/phone (but not role)
-- Uncomment if you want users to be able to update their profile
-- DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
-- CREATE POLICY "Users can update their own data" ON public.users
--   FOR UPDATE USING (auth.uid() = id)
--   WITH CHECK (
--     auth.uid() = id
--     AND role = (SELECT role FROM public.users WHERE id = auth.uid())
--   );

