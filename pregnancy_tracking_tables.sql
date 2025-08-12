-- Create pregnancy tracking tables
-- Pregnancy Info Table
CREATE TABLE IF NOT EXISTS pregnancy_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL,
  conception_date DATE,
  trimester INTEGER NOT NULL,
  weeks_pregnant INTEGER NOT NULL,
  days_pregnant INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pregnancy Symptoms Table
CREATE TABLE IF NOT EXISTS pregnancy_symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symptom TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pregnancy Appointments Table
CREATE TABLE IF NOT EXISTS pregnancy_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  type TEXT,
  doctor TEXT,
  location TEXT,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pregnancy Milestones Table
CREATE TABLE IF NOT EXISTS pregnancy_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pregnancy_info_user_id ON pregnancy_info(user_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_symptoms_user_id ON pregnancy_symptoms(user_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_symptoms_date ON pregnancy_symptoms(date);
CREATE INDEX IF NOT EXISTS idx_pregnancy_appointments_user_id ON pregnancy_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_appointments_date ON pregnancy_appointments(date);
CREATE INDEX IF NOT EXISTS idx_pregnancy_milestones_user_id ON pregnancy_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_milestones_date ON pregnancy_milestones(date);

-- Enable Row Level Security (RLS)
ALTER TABLE pregnancy_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pregnancy_info
CREATE POLICY "Users can view their own pregnancy info" ON pregnancy_info
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pregnancy info" ON pregnancy_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pregnancy info" ON pregnancy_info
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pregnancy info" ON pregnancy_info
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for pregnancy_symptoms
CREATE POLICY "Users can view their own pregnancy symptoms" ON pregnancy_symptoms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pregnancy symptoms" ON pregnancy_symptoms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pregnancy symptoms" ON pregnancy_symptoms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pregnancy symptoms" ON pregnancy_symptoms
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for pregnancy_appointments
CREATE POLICY "Users can view their own pregnancy appointments" ON pregnancy_appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pregnancy appointments" ON pregnancy_appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pregnancy appointments" ON pregnancy_appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pregnancy appointments" ON pregnancy_appointments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for pregnancy_milestones
CREATE POLICY "Users can view their own pregnancy milestones" ON pregnancy_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pregnancy milestones" ON pregnancy_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pregnancy milestones" ON pregnancy_milestones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pregnancy milestones" ON pregnancy_milestones
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_pregnancy_info_updated_at 
  BEFORE UPDATE ON pregnancy_info 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregnancy_symptoms_updated_at 
  BEFORE UPDATE ON pregnancy_symptoms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregnancy_appointments_updated_at 
  BEFORE UPDATE ON pregnancy_appointments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregnancy_milestones_updated_at 
  BEFORE UPDATE ON pregnancy_milestones 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
