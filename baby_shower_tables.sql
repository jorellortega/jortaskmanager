-- Baby Shower Database Tables
-- Run this in your Supabase SQL Editor

-- Baby Shower Information Table
CREATE TABLE IF NOT EXISTS baby_shower_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_date DATE NOT NULL,
  venue TEXT NOT NULL,
  theme TEXT,
  budget DECIMAL(10,2) DEFAULT 0,
  guest_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Baby Shower Guests Table
CREATE TABLE IF NOT EXISTS baby_shower_guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')) DEFAULT 'pending',
  dietary_restrictions TEXT,
  plus_one BOOLEAN DEFAULT FALSE,
  plus_one_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Baby Shower Gifts Table
CREATE TABLE IF NOT EXISTS baby_shower_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  purchased BOOLEAN DEFAULT FALSE,
  purchased_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Baby Shower Food Table
CREATE TABLE IF NOT EXISTS baby_shower_food (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT,
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Baby Shower Decorations Table
CREATE TABLE IF NOT EXISTS baby_shower_decorations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  purchased BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_baby_shower_info_user_id ON baby_shower_info(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_shower_info_event_date ON baby_shower_info(event_date);
CREATE INDEX IF NOT EXISTS idx_baby_shower_guests_user_id ON baby_shower_guests(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_shower_guests_rsvp_status ON baby_shower_guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_baby_shower_gifts_user_id ON baby_shower_gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_shower_gifts_category ON baby_shower_gifts(category);
CREATE INDEX IF NOT EXISTS idx_baby_shower_gifts_purchased ON baby_shower_gifts(purchased);
CREATE INDEX IF NOT EXISTS idx_baby_shower_food_user_id ON baby_shower_food(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_shower_food_category ON baby_shower_food(category);
CREATE INDEX IF NOT EXISTS idx_baby_shower_decorations_user_id ON baby_shower_decorations(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_shower_decorations_category ON baby_shower_decorations(category);
CREATE INDEX IF NOT EXISTS idx_baby_shower_decorations_purchased ON baby_shower_decorations(purchased);

-- Enable Row Level Security
ALTER TABLE baby_shower_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower_food ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower_decorations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for baby_shower_info
CREATE POLICY "Users can view their own baby shower info" ON baby_shower_info
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby shower info" ON baby_shower_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby shower info" ON baby_shower_info
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby shower info" ON baby_shower_info
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for baby_shower_guests
CREATE POLICY "Users can view their own baby shower guests" ON baby_shower_guests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby shower guests" ON baby_shower_guests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby shower guests" ON baby_shower_guests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby shower guests" ON baby_shower_guests
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for baby_shower_gifts
CREATE POLICY "Users can view their own baby shower gifts" ON baby_shower_gifts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby shower gifts" ON baby_shower_gifts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby shower gifts" ON baby_shower_gifts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby shower gifts" ON baby_shower_gifts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for baby_shower_food
CREATE POLICY "Users can view their own baby shower food" ON baby_shower_food
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby shower food" ON baby_shower_food
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby shower food" ON baby_shower_food
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby shower food" ON baby_shower_food
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for baby_shower_decorations
CREATE POLICY "Users can view their own baby shower decorations" ON baby_shower_decorations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baby shower decorations" ON baby_shower_decorations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baby shower decorations" ON baby_shower_decorations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baby shower decorations" ON baby_shower_decorations
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_baby_shower_info_updated_at
  BEFORE UPDATE ON baby_shower_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baby_shower_guests_updated_at
  BEFORE UPDATE ON baby_shower_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baby_shower_gifts_updated_at
  BEFORE UPDATE ON baby_shower_gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baby_shower_food_updated_at
  BEFORE UPDATE ON baby_shower_food
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baby_shower_decorations_updated_at
  BEFORE UPDATE ON baby_shower_decorations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
