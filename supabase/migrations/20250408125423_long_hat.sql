/*
  # Fix RLS policies for flours table

  1. Changes
    - Update RLS policies for the flours table
    - Add comprehensive read access policy for authenticated users
    - Maintain preview access for public users
    - Remove invalid WITH CHECK clause from SELECT policies

  2. Security
    - Maintains RLS enabled
    - Ensures proper access control
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Allow paid subscribers to access full flour details" ON flours;
DROP POLICY IF EXISTS "Allow preview access to flours" ON flours;
DROP POLICY IF EXISTS "Lecture publique des farines" ON flours;

-- Create new policies with proper access control
CREATE POLICY "Allow authenticated users to read flours"
  ON flours
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public preview access to flours"
  ON flours
  FOR SELECT
  TO public
  USING (true);
