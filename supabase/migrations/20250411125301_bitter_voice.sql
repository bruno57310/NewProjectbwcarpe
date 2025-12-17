/*
  # Update flours_template permissions for admin user

  1. Changes
    - Add policy for admin to manage flours_template
    - Allow full CRUD access for admin user
    - Maintain existing policies for other users

  2. Security
    - Only admin can manage template data
    - Maintains existing read access for other users
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow template data insertion" ON flours_template;
DROP POLICY IF EXISTS "Allow paid subscribers to access full flour template details" ON flours_template;
DROP POLICY IF EXISTS "Allow preview access to flour templates" ON flours_template;

-- Create comprehensive policies for template access
CREATE POLICY "Allow paid subscribers to access full flour template details"
  ON flours_template
  FOR SELECT
  TO authenticated
  USING (has_paid_subscription(auth.uid()));

CREATE POLICY "Allow preview access to flour templates"
  ON flours_template
  FOR SELECT
  TO public
  USING (true);

-- Add policy for admin to manage all template data
CREATE POLICY "Allow admin to manage template data"
  ON flours_template
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND email = 'bruno_wendling@orange.fr'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND email = 'bruno_wendling@orange.fr'
    )
  );
