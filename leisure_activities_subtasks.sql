-- Add subtask support to leisure_activities table
-- Add parent_id field to support hierarchical tasks

ALTER TABLE leisure_activities 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES leisure_activities(id) ON DELETE CASCADE;

-- Create index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS idx_leisure_activities_parent_id ON leisure_activities(parent_id);

-- Update RLS policies to ensure users can only access their own tasks and subtasks
-- The existing RLS policies should already handle this through the user_id field
-- but we can add a more specific policy for subtasks if needed

-- Optional: Add a policy specifically for subtasks
CREATE POLICY "Users can view their own leisure activities and subtasks" ON leisure_activities
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM leisure_activities WHERE id = leisure_activities.parent_id
    )
  );
