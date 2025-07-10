-- Cycle Tracking Tables for Weekly Task Manager

-- Table for cycle entries (period tracking)
CREATE TABLE IF NOT EXISTS cycle_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy')) DEFAULT 'medium',
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for symptom logs (daily symptom tracking)
CREATE TABLE IF NOT EXISTS symptom_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  mood TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE cycle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for cycle_entries
CREATE POLICY "Users can view their own cycle entries" ON cycle_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cycle entries" ON cycle_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycle entries" ON cycle_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cycle entries" ON cycle_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for symptom_logs
CREATE POLICY "Users can view their own symptom logs" ON symptom_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptom logs" ON symptom_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptom logs" ON symptom_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptom logs" ON symptom_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cycle_entries_user_id ON cycle_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_entries_start_date ON cycle_entries(start_date);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_id ON symptom_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_date ON symptom_logs(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_cycle_entries_updated_at 
  BEFORE UPDATE ON cycle_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symptom_logs_updated_at 
  BEFORE UPDATE ON symptom_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 