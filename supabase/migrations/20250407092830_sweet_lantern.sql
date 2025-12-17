/*
  # Update flours_template RLS policies

  1. Changes
    - Add policy to allow authenticated users to insert template data
    - Keep existing policies for SELECT operations

  2. Security
    - Maintains RLS enabled on flours_template table
    - Adds INSERT policy for authenticated users
*/

-- Drop existing INSERT policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flours_template' 
    AND cmd = 'INSERT'
  ) THEN
    DROP POLICY IF EXISTS "Allow authenticated users to insert template data" ON flours_template;
  END IF;
END $$;

-- Create new INSERT policy
CREATE POLICY "Allow authenticated users to insert template data"
ON flours_template
FOR INSERT
TO authenticated
WITH CHECK (true);
