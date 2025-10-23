-- Fix RLS DELETE policy for peers table
-- This allows users to delete records where they are either user_id OR peer_user_id

-- Drop the existing restrictive DELETE policy
DROP POLICY IF EXISTS "Users can delete their own peer connections" ON peers;

-- Create a new policy that allows deletion if the authenticated user is either the user_id or the peer_user_id
CREATE POLICY "Users can delete peer connections" ON peers
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.uid() = peer_user_id
  );
