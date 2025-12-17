/*
  # Fix auth.users table permissions

  1. Changes
    - Grant SELECT permission on auth.users table to authenticated users
    - Create RLS policy to allow users to read their own data
    - Ensure proper access to user session data

  2. Security
    - Users can only read their own user record
    - Maintains data isolation between users
*/

-- Grant SELECT permission on auth.users to authenticated users
GRANT SELECT ON auth.users TO authenticated;

-- Enable RLS on auth.users if not already enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can read own user data" ON auth.users;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own user data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
