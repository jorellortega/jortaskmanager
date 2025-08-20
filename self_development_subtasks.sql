-- Add subtask support to self_development_priorities table
-- Add parent_id field to support hierarchical tasks

ALTER TABLE self_development_priorities 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES self_development_priorities(id) ON DELETE CASCADE;

-- Create index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS idx_self_dev_priorities_parent_id ON self_development_priorities(parent_id);

-- Update RLS policies to ensure users can only access their own tasks and subtasks
-- The existing RLS policies should already handle this through the user_id field
-- but we can add a more specific policy for subtasks if needed

-- Optional: Add a policy specifically for subtasks
CREATE POLICY "Users can view their own self-development priorities and subtasks" ON self_development_priorities
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM self_development_priorities WHERE id = self_development_priorities.parent_id
    )
  );
