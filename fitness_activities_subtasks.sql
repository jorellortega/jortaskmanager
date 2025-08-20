-- Add subtask support to fitness_activities table
-- Add parent_id field to support hierarchical tasks

ALTER TABLE fitness_activities
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES fitness_activities(id) ON DELETE CASCADE;

-- Create index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS idx_fitness_activities_parent_id ON fitness_activities(parent_id);

-- Update RLS policies to ensure users can only access their own tasks and subtasks
-- The existing RLS policies should already handle this through the user_id field
-- but we can add a more specific policy for subtasks if needed

-- Optional: Add a policy specifically for subtasks
CREATE POLICY "Users can view their own fitness activities and subtasks" ON fitness_activities
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM fitness_activities WHERE id = fitness_activities.parent_id
    )
  );
