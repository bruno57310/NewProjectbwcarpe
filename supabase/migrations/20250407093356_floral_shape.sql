/*
  # Update RLS policies for template data insertion

  1. Changes
    - Drop existing insert policies to avoid conflicts
    - Add new policy allowing both service role and authenticated users to insert data
    - Ensure proper security while allowing template data population

  2. Security
    - Maintains RLS enabled
    - Allows service role to insert template data
    - Allows authenticated users to insert data
*/

-- Drop any existing insert policies
DROP POLICY IF EXISTS "Allow authenticated users to insert template data" ON flours_template;
DROP POLICY IF EXISTS "Allow template data insertion" ON flours_template;

-- Create new insert policy that allows both authenticated users and service role
CREATE POLICY "Allow template data insertion" 
ON flours_template
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow service role or authenticated users
  (auth.jwt() ->> 'role' = 'service_role') OR 
  (auth.role() = 'authenticated')
);
