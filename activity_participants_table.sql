-- Create activity_participants table for universal join functionality
CREATE TABLE IF NOT EXISTS activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'fitness', 'calendar', 'appointments', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  peer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- who created the original activity
  joined_at TIMESTAMP DEFAULT NOW(),
  status TEXT CHECK (status IN ('joined', 'completed', 'cancelled', 'maybe', 'declined')) DEFAULT 'joined',
  note TEXT, -- Optional note from participant
  UNIQUE(activity_id, activity_type, user_id)
);

-- Add RLS policies for activity_participants table
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read participants for activities they are involved in
CREATE POLICY "Users can view participants for their activities or joined activities" ON activity_participants
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = peer_user_id OR
    EXISTS (
      SELECT 1 FROM fitness_activities fa WHERE fa.id = activity_participants.activity_id AND fa.user_id = auth.uid()
    )
  );

-- Policy to allow users to insert new participation records
CREATE POLICY "Users can join activities" ON activity_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own participation status or note
CREATE POLICY "Users can update their own participation" ON activity_participants
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own participation record
CREATE POLICY "Users can leave activities" ON activity_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON activity_participants(user_id);
