-- Update meal_plans table to add time fields
-- Add optional time fields for breakfast, lunch, and dinner

ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS breakfast_time TIME,
ADD COLUMN IF NOT EXISTS lunch_time TIME,
ADD COLUMN IF NOT EXISTS dinner_time TIME;

-- Create grocery_items table for tracking grocery items
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('need_to_buy', 'already_have')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON grocery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_status ON grocery_items(status);
CREATE INDEX IF NOT EXISTS idx_grocery_items_category ON grocery_items(category);

-- Enable Row Level Security (RLS)
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own grocery items" ON grocery_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grocery items" ON grocery_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery items" ON grocery_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery items" ON grocery_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_grocery_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_grocery_items_updated_at();
