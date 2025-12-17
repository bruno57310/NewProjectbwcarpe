/*
  # Add insert policy for flours template if it doesn't exist

  1. Changes
    - Safely check for existing policy before creating
    - Add policy to allow authenticated users to insert template data
    - Use DO block for conditional creation
*/

DO $$ 
BEGIN
  -- Only create policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'flours_template' 
      AND policyname = 'Allow authenticated users to insert template data'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert template data"
      ON flours_template
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;
