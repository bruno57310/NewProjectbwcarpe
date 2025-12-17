/*
  # Fix flours_template permissions for admin user

  1. Changes
    - Drop existing policies
    - Add new policy for admin user with full access
    - Add policy for paid subscribers to view templates
    - Add policy for public preview access
    - Ensure proper email check for admin access

  2. Security
    - Ensures admin has full CRUD access
    - Maintains existing read access for other users
    - Uses proper auth checks
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Allow template data insertion" ON flours_template;
DROP POLICY IF EXISTS "Allow paid subscribers to access full flour template details" ON flours_template;
DROP POLICY IF EXISTS "Allow preview access to flour templates" ON flours_template;
DROP POLICY IF EXISTS "Allow admin to manage template data" ON flours_template;

-- Create policy for admin to manage all template data
CREATE POLICY "Allow admin to manage template data"
  ON flours_template
  FOR ALL
  TO authenticated
  USING (
    auth.email() = 'bruno_wendling@orange.fr'
  )
  WITH CHECK (
    auth.email() = 'bruno_wendling@orange.fr'
  );

-- Create policy for paid subscribers to view templates
CREATE POLICY "Allow paid subscribers to access full flour template details"
  ON flours_template
  FOR SELECT
  TO authenticated
  USING (has_paid_subscription(auth.uid()));

-- Create policy for public preview access
CREATE POLICY "Allow preview access to flour templates"
  ON flours_template
  FOR SELECT
  TO public
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE flours_template ENABLE ROW LEVEL SECURITY;
