/*
  # Add email() function for RLS policies

  1. Changes
    - Create email() function to get current user's email
    - Function returns the email of the currently authenticated user
    - Used in RLS policies for better user identification

  2. Security
    - Function is SECURITY DEFINER to ensure proper access control
    - Returns NULL for unauthenticated users
*/

-- Create or replace the email function
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
