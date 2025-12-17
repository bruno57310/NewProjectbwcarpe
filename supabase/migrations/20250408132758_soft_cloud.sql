/*
  # Fix RLS policies for flours table

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create comprehensive policies for all operations
    - Enable proper access control for authenticated users

  2. Security
    - Maintain RLS enabled
    - Allow authenticated users full CRUD access
    - Keep public read-only access
*/

-- First, ensure RLS is enabled
ALTER TABLE flours ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read flours" ON flours;
DROP POLICY IF EXISTS "Allow public preview access to flours" ON flours;
DROP POLICY IF EXISTS "Allow authenticated users to insert flours" ON flours;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Allow authenticated users to manage flours"
ON flours
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Keep public read-only access
CREATE POLICY "Allow public preview access to flours"
ON flours
FOR SELECT
TO public
USING (true);
