-- Peer Sync Database Tables
-- Run this in your Supabase SQL Editor

-- Peer Connections Table
CREATE TABLE IF NOT EXISTS peers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  peer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, peer_user_id)
);

-- Peer Sync Preferences Table
CREATE TABLE IF NOT EXISTS peer_sync_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Peer Sync Data Table (for shared data)
CREATE TABLE IF NOT EXISTS peer_sync_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  peer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data_id TEXT NOT NULL,
  data_content JSONB,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, peer_user_id, category, data_type, data_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_peers_user_id ON peers(user_id);
CREATE INDEX IF NOT EXISTS idx_peers_peer_user_id ON peers(peer_user_id);
CREATE INDEX IF NOT EXISTS idx_peers_status ON peers(status);
CREATE INDEX IF NOT EXISTS idx_peer_sync_preferences_user_id ON peer_sync_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_sync_data_user_id ON peer_sync_data(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_sync_data_peer_user_id ON peer_sync_data(peer_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_sync_data_category ON peer_sync_data(category);

-- Enable Row Level Security
ALTER TABLE peers ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_sync_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_sync_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for peers
CREATE POLICY "Users can view their own peer connections" ON peers
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = peer_user_id);

CREATE POLICY "Users can insert their own peer connections" ON peers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own peer connections" ON peers
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = peer_user_id);

CREATE POLICY "Users can delete their own peer connections" ON peers
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for peer_sync_preferences
CREATE POLICY "Users can view their own sync preferences" ON peer_sync_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync preferences" ON peer_sync_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync preferences" ON peer_sync_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync preferences" ON peer_sync_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for peer_sync_data
CREATE POLICY "Users can view shared data" ON peer_sync_data
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = peer_user_id);

CREATE POLICY "Users can insert shared data" ON peer_sync_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shared data" ON peer_sync_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete shared data" ON peer_sync_data
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
CREATE TRIGGER update_peers_updated_at
  BEFORE UPDATE ON peers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_peer_sync_preferences_updated_at
  BEFORE UPDATE ON peer_sync_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default sync preferences for existing users
INSERT INTO peer_sync_preferences (user_id, category, enabled)
SELECT 
  auth.users.id,
  unnest(ARRAY['calendar', 'appointments', 'expenses', 'leisure', 'fitness', 'birthdays', 'routines', 'feed', 'todo', 'goals', 'brainstorming', 'travel', 'work-clock', 'notes', 'journal', 'meal-planning']),
  CASE 
    WHEN unnest(ARRAY['calendar', 'appointments', 'expenses', 'leisure', 'fitness', 'birthdays', 'routines', 'feed', 'todo', 'goals', 'brainstorming', 'travel', 'work-clock', 'notes', 'journal', 'meal-planning']) IN ('calendar', 'appointments', 'leisure', 'fitness', 'birthdays', 'goals', 'travel', 'meal-planning') THEN TRUE
    ELSE FALSE
  END
FROM auth.users
ON CONFLICT (user_id, category) DO NOTHING;
