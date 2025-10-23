-- Create a function to safely get user information
-- This function runs on the server side and can access the public.users table

CREATE OR REPLACE FUNCTION get_user_info(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(u.name, '') as name
  FROM public.users u
  WHERE u.id = user_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_info(UUID) TO authenticated;
