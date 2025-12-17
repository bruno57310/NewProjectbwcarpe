/*
  # Enable RLS for test table with enterprise-only access

  1. Changes
    - Enable RLS on test table
    - Add policies for enterprise users only
    - Ensure proper owner_id checks
    
  2. Security
    - Only enterprise subscribers can access
    - Users can only access their own data
    - Requires active subscription
*/

-- Enable RLS
ALTER TABLE test ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow enterprise users to read test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to insert test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to update test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to delete test" ON test;

-- Create new policies for enterprise users only
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
