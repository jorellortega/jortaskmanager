-- Fix RLS policy for peers table to allow reciprocal connections
-- This allows users to insert records where they are either user_id OR peer_user_id

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own peer connections" ON peers;

-- Create a new policy that allows both scenarios
CREATE POLICY "Users can insert peer connections" ON peers
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() = peer_user_id
  );

-- Also update the update policy to be more permissive
DROP POLICY IF EXISTS "Users can update their own peer connections" ON peers;

CREATE POLICY "Users can update peer connections" ON peers
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = peer_user_id
  );
