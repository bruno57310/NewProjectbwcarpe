/*
  # Fix owner_id column references in RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with unambiguous owner_id references
    - Ensure proper index exists

  2. Security
    - Maintain enterprise subscription requirement
    - Keep user-specific access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow enterprise users to read test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to insert test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to update test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to delete test" ON test;

-- Create new policies with unambiguous owner_id references
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
