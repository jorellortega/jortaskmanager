-- Wedding Planning Database Tables
-- Run this in your Supabase SQL Editor

-- Wedding Information Table
CREATE TABLE IF NOT EXISTS wedding_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wedding_date DATE NOT NULL,
  venue TEXT NOT NULL,
  budget DECIMAL(10,2) DEFAULT 0,
  guest_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Vendors Table
CREATE TABLE IF NOT EXISTS wedding_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('contacted', 'quoted', 'booked', 'paid')) DEFAULT 'contacted',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Tasks Table
CREATE TABLE IF NOT EXISTS wedding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Guests Table
CREATE TABLE IF NOT EXISTS wedding_guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  plus_one BOOLEAN DEFAULT FALSE,
  plus_one_name TEXT,
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')) DEFAULT 'pending',
  dietary_restrictions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wedding_info_user_id ON wedding_info(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_info_wedding_date ON wedding_info(wedding_date);
CREATE INDEX IF NOT EXISTS idx_wedding_vendors_user_id ON wedding_vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_vendors_category ON wedding_vendors(category);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_user_id ON wedding_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_due_date ON wedding_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_completed ON wedding_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_user_id ON wedding_guests(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_rsvp_status ON wedding_guests(rsvp_status);

-- Enable Row Level Security
ALTER TABLE wedding_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_guests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wedding_info
CREATE POLICY "Users can view their own wedding info" ON wedding_info
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wedding info" ON wedding_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wedding info" ON wedding_info
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wedding info" ON wedding_info
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for wedding_vendors
CREATE POLICY "Users can view their own wedding vendors" ON wedding_vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wedding vendors" ON wedding_vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wedding vendors" ON wedding_vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wedding vendors" ON wedding_vendors
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for wedding_tasks
CREATE POLICY "Users can view their own wedding tasks" ON wedding_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wedding tasks" ON wedding_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wedding tasks" ON wedding_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wedding tasks" ON wedding_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for wedding_guests
CREATE POLICY "Users can view their own wedding guests" ON wedding_guests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wedding guests" ON wedding_guests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wedding guests" ON wedding_guests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wedding guests" ON wedding_guests
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
CREATE TRIGGER update_wedding_info_updated_at
  BEFORE UPDATE ON wedding_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_vendors_updated_at
  BEFORE UPDATE ON wedding_vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_tasks_updated_at
  BEFORE UPDATE ON wedding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_guests_updated_at
  BEFORE UPDATE ON wedding_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
