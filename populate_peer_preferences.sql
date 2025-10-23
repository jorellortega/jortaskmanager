-- Populate peer_sync_preferences table with default data for existing users
-- Run this in your Supabase SQL Editor

-- Insert default sync preferences for all existing users
INSERT INTO peer_sync_preferences (user_id, preference_key, enabled)
SELECT 
  auth.users.id,
  unnest(ARRAY['calendar', 'appointments', 'expenses', 'leisure', 'fitness', 'birthdays', 'routines', 'feed', 'todo', 'goals', 'brainstorming', 'travel', 'work-clock', 'notes', 'journal', 'meal-planning']),
  CASE 
    WHEN unnest(ARRAY['calendar', 'appointments', 'expenses', 'leisure', 'fitness', 'birthdays', 'routines', 'feed', 'todo', 'goals', 'brainstorming', 'travel', 'work-clock', 'notes', 'journal', 'meal-planning']) IN ('calendar', 'appointments', 'leisure', 'fitness', 'birthdays', 'goals', 'travel', 'meal-planning') THEN TRUE
    ELSE FALSE
  END
FROM auth.users
ON CONFLICT (user_id, preference_key) DO NOTHING;
