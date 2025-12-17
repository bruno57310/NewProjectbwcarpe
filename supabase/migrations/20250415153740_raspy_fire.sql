/*
  # Disable RLS for test table

  1. Changes
    - Disable RLS on test table
    - Drop all existing policies
    - Remove security restrictions

  2. Security
    - Remove all RLS policies
    - Allow public access to table
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow enterprise users to read test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to insert test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to update test" ON test;
DROP POLICY IF EXISTS "Allow enterprise users to delete test" ON test;

-- Disable RLS
ALTER TABLE test DISABLE ROW LEVEL SECURITY;
