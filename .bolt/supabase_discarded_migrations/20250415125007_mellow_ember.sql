/*
  # Fix test table structure and policies

  1. Changes
    - Add user_id column to test table
    - Update RLS policies with properly qualified column references
    - Ensure proper data isolation between users

  2. Security
    - Users can only access their own data
    - Enterprise subscription still required
    - Maintain data isolation between users
*/

-- First, add user_id column if it doesn't exist
ALTER TABLE test
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow enterprise users to read test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to insert test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to update test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to delete test" ON test;

-- Create new policies with properly qualified user_id checks
CREATE POLICY "Allow enterprise users to read test"
  ON test
  FOR SELECT
  TO authenticated
  USING (
    test.user_id = auth.uid() AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Allow enterprise users to insert test"
  ON test
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Allow enterprise users to update test"
  ON test
  FOR UPDATE
  TO authenticated
  USING (
    test.user_id = auth.uid() AND 
    has_enterprise_subscription(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Allow enterprise users to delete test"
  ON test
  FOR DELETE
  TO authenticated
  USING (
    test.user_id = auth.uid() AND 
    has_enterprise_subscription(auth.uid())
  );

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_test_user_id ON test(user_id);
