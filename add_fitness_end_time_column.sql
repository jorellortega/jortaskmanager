-- Add activity_end_time column to fitness_activities table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.fitness_activities 
ADD COLUMN activity_end_time TEXT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.fitness_activities.activity_end_time IS 'End time for fitness activities (optional time range)';
