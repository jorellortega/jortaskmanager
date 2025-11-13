-- Update RLS policies for ai_settings to use public.users.role
-- Run this if you've already run the ai_settings_migration.sql

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can insert ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can update ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can delete ai_settings" ON public.ai_settings;

-- Recreate policies using public.users.role
CREATE POLICY "Admins can view ai_settings" ON public.ai_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert ai_settings" ON public.ai_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update ai_settings" ON public.ai_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete ai_settings" ON public.ai_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

