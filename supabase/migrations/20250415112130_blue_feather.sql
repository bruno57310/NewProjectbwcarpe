-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to test" ON test;
DROP POLICY IF EXISTS "Allow public insert access to test" ON test;
DROP POLICY IF EXISTS "Allow public update access to test" ON test;
DROP POLICY IF EXISTS "Allow public delete access to test" ON test;

-- Create new policies for enterprise users only
CREATE POLICY "Allow enterprise users to read test"
  ON test
  FOR SELECT
  TO authenticated
  USING (has_enterprise_subscription(auth.uid()));

CREATE POLICY "Allow enterprise users to insert test"
  ON test
  FOR INSERT
  TO authenticated
  WITH CHECK (has_enterprise_subscription(auth.uid()));

CREATE POLICY "Allow enterprise users to update test"
  ON test
  FOR UPDATE
  TO authenticated
  USING (has_enterprise_subscription(auth.uid()))
  WITH CHECK (has_enterprise_subscription(auth.uid()));

CREATE POLICY "Allow enterprise users to delete test"
  ON test
  FOR DELETE
  TO authenticated
  USING (has_enterprise_subscription(auth.uid()));
