-- Quick Add Buttons Table for Weekly Task Manager
-- Run this in your Supabase SQL Editor

-- Quick Add Buttons Table
CREATE TABLE IF NOT EXISTS quick_add_buttons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('todo', 'work', 'selfdev', 'leisure', 'fitness', 'appointment', 'cycle', 'pregnancy', 'wedding', 'baby_shower')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quick_add_buttons_user_id ON quick_add_buttons(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_add_buttons_category ON quick_add_buttons(category);
CREATE INDEX IF NOT EXISTS idx_quick_add_buttons_sort_order ON quick_add_buttons(sort_order);
CREATE INDEX IF NOT EXISTS idx_quick_add_buttons_is_active ON quick_add_buttons(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE quick_add_buttons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quick add buttons" ON quick_add_buttons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quick add buttons" ON quick_add_buttons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick add buttons" ON quick_add_buttons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick add buttons" ON quick_add_buttons
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quick_add_buttons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_quick_add_buttons_updated_at 
  BEFORE UPDATE ON quick_add_buttons 
  FOR EACH ROW 
  EXECUTE FUNCTION update_quick_add_buttons_updated_at();

-- Insert default quick add buttons for new users
CREATE OR REPLACE FUNCTION create_default_quick_add_buttons()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO quick_add_buttons (user_id, name, category, icon, color, priority, sort_order) VALUES
    (NEW.id, 'Todo', 'todo', 'Plus', 'purple', 'medium', 1),
    (NEW.id, 'Work Task', 'work', 'Briefcase', 'blue', 'medium', 2),
    (NEW.id, 'Self Development', 'selfdev', 'Target', 'yellow', 'medium', 3),
    (NEW.id, 'Leisure Activity', 'leisure', 'Utensils', 'green', 'low', 4),
    (NEW.id, 'Fitness Activity', 'fitness', 'Dumbbell', 'purple', 'medium', 5),
    (NEW.id, 'Appointment', 'appointment', 'Clock', 'green', 'high', 6);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to add default buttons for new users
CREATE TRIGGER create_default_quick_add_buttons_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_quick_add_buttons();
