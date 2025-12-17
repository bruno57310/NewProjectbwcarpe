/*
  # Fix auth users access for login debugging

  1. Security
    - Add policy to allow users to read their own auth data for debugging
    - This is temporary for debugging login issues
*/

-- Allow authenticated users to read their own auth data
CREATE POLICY "Users can read own auth data" ON auth.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
