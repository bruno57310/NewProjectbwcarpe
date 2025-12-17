/*
  # Add insert policy for flours_template

  1. Changes
    - Add policy to allow inserting data into flours_template table
    - Maintain existing RLS policies
    - Allow authenticated users to insert template data

  2. Security
    - Only authenticated users can insert data
    - Maintains existing read policies
*/

-- Add policy for inserting template data
CREATE POLICY "Allow authenticated users to insert template data"
  ON flours_template
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
