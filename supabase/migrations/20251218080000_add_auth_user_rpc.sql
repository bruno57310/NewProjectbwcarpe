CREATE OR REPLACE FUNCTION get_auth_user_by_email(user_email text)
RETURNS TABLE (id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id 
  FROM auth.users au
  WHERE au.email ILIKE '%' || user_email || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_auth_user_by_email IS 'Secure access to auth.users for profile matching';
