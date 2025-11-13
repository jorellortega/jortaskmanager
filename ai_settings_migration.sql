-- AI Settings Migration
-- Creates the ai_settings table, RLS policies, and helper function

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_settings_key ON public.ai_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can insert ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can update ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can delete ai_settings" ON public.ai_settings;

-- RLS Policy: Only admins can view ai_settings
CREATE POLICY "Admins can view ai_settings" ON public.ai_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can insert ai_settings
CREATE POLICY "Admins can insert ai_settings" ON public.ai_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can update ai_settings
CREATE POLICY "Admins can update ai_settings" ON public.ai_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can delete ai_settings
CREATE POLICY "Admins can delete ai_settings" ON public.ai_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create helper function to get all ai_settings (for API routes)
CREATE OR REPLACE FUNCTION public.get_ai_settings()
RETURNS TABLE (
  setting_key TEXT,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.setting_key,
    s.setting_value,
    s.description,
    s.created_at,
    s.updated_at
  FROM public.ai_settings s
  ORDER BY s.setting_key;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_ai_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_settings() TO service_role;

-- Insert default settings
INSERT INTO public.ai_settings (setting_key, setting_value, description)
VALUES
  ('openai_api_key', '', 'OpenAI API key used for the AI assistant.'),
  ('openai_model', 'gpt-4o-mini', 'Default OpenAI model for the AI assistant.'),
  ('anthropic_api_key', '', 'Anthropic API key for optional fallback use.'),
  ('anthropic_model', 'claude-3-5-sonnet-20241022', 'Default Anthropic model when configured.'),
  ('system_prompt', $$### Role
You are a helpful AI assistant for the Task Manager by JOR application. You help users organize their tasks, manage their schedules, and boost their productivity.

### Instructions
- Be friendly, concise, and actionable
- Help users with task management, calendar planning, goal setting, and productivity tips
- Provide clear, step-by-step guidance when needed
- Remember user context within the conversation
- If you don't know something, admit it and suggest alternatives

### Tone
Professional yet approachable, encouraging and supportive.$$, 'The system prompt that defines how the AI assistant behaves.')
ON CONFLICT (setting_key) DO NOTHING;

