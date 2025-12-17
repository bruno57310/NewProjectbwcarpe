/*
  # Update RLS policies for flours table

  1. Security Changes
    - Add policy for authenticated users to read all flour data
    - Add policy for public users to read basic flour data
    - Ensure RLS is enabled on the flours table

  2. Changes
    - Adds two new RLS policies to the flours table:
      1. Authenticated users can read all flour data
      2. Public users can read basic flour information
*/

-- Enable RLS if not already enabled
ALTER TABLE flours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read flours" ON flours;
DROP POLICY IF EXISTS "Allow public preview access to flours" ON flours;

-- Create policy for authenticated users to read all flour data
CREATE POLICY "Allow authenticated users to read flours"
ON flours
FOR SELECT
TO authenticated
USING (true);

-- Create policy for public users to read basic flour information
CREATE POLICY "Allow public preview access to flours"
ON flours
FOR SELECT
TO public
USING (true);
