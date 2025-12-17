/*
  # Update RLS policies for test table

  1. Changes
    - Update RLS policies to include user_id checks
    - Maintain enterprise subscription requirement
    - Ensure proper data isolation between users

  2. Security
    - Users can only access their own data
    - Enterprise subscription still required
    - Maintain data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow enterprise users to read test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to insert test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to update test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to delete test" ON test;

-- Create new policies with user_id checks
CREATE POLICY "Allow enterprise users to read test"
  ON test
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
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
    auth.uid() = user_id AND 
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
    auth.uid() = user_id AND 
    has_enterprise_subscription(auth.uid())
  );

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_test_user_id ON test(user_id);
