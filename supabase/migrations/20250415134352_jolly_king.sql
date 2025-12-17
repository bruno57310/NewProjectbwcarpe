/*
  # Fix ambiguous owner column references

  1. Changes
    - Drop existing policies
    - Recreate policies with properly qualified owner_id references
    - Update index for owner_id column

  2. Security
    - Maintain enterprise subscription requirement
    - Ensure proper data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow enterprise users to read test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to insert test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to update test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to delete test" ON test;

-- Create new policies with properly qualified owner_id references
CREATE POLICY "Allow enterprise users to read test"
  ON test
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Allow enterprise users to insert test"
  ON test
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Allow enterprise users to update test"
  ON test
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() AND 
    has_enterprise_subscription(auth.uid())
  )
  WITH CHECK (
    auth.uid() = owner_id AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Allow enterprise users to delete test"
  ON test
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() AND 
    has_enterprise_subscription(auth.uid())
  );

-- Ensure index exists for owner_id
DROP INDEX IF EXISTS idx_test_owner_id;
CREATE INDEX idx_test_owner_id ON test(owner_id);
