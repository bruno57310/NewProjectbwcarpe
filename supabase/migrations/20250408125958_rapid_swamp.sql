/*
  # Add INSERT policy for flours table

  1. Changes
    - Add policy to allow authenticated users to insert new flours
    - Maintain existing SELECT policies
    - Ensure proper RLS configuration

  2. Security
    - Only authenticated users can insert new flours
    - Maintains existing read access policies
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert flours" ON flours;

-- Create new insert policy for authenticated users
CREATE POLICY "Allow authenticated users to insert flours"
ON flours
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE flours ENABLE ROW LEVEL SECURITY;
