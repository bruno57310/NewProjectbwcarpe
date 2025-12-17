/*
  # Rename user_id column to owner_id in test table

  1. Changes
    - Rename user_id column to owner_id
    - Update foreign key constraint
    - Update RLS policies to use new column name
    - Update indexes

  2. Security
    - Maintain existing security model
    - Update RLS policies to use new column name
*/

-- Rename the column
ALTER TABLE test
RENAME COLUMN user_id TO owner_id;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow enterprise users to read test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to insert test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to update test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to delete test" ON test;

-- Create new policies with owner_id
CREATE POLICY "Allow enterprise users to read test"
  ON test
  FOR SELECT
  TO authenticated
  USING (
    test.owner_id = auth.uid() AND 
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
    test.owner_id = auth.uid() AND 
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
    test.owner_id = auth.uid() AND 
    has_enterprise_subscription(auth.uid())
  );

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_test_user_id;
CREATE INDEX idx_test_owner_id ON test(owner_id);
