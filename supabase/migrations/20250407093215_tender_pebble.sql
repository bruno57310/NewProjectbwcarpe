/*
  # Update RLS policies for flours_template

  1. Changes
    - Add policy to allow service role to insert template data
    - Keep existing policies intact
  
  2. Security
    - Maintains RLS enabled
    - Adds specific policy for service role operations
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert template data" ON flours_template;

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
