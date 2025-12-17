/*
  # Add updated_at column to flours_template table

  1. Changes
    - Add updated_at column to flours_template table if it doesn't exist
    - Set default value to now()
    - Create or update trigger to automatically update the column on record update
    
  2. Security
    - No changes to RLS policies
    - No security implications
*/

-- Check if updated_at column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'flours_template' 
    AND column_name = 'updated_at'
  ) THEN
    -- Add the updated_at column
    ALTER TABLE flours_template 
    ADD COLUMN updated_at timestamptz DEFAULT now();
    
    -- Ensure the trigger exists to update this column
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_trigger 
      WHERE tgname = 'update_flours_template_updated_at'
    ) THEN
      CREATE TRIGGER update_flours_template_updated_at
      BEFORE UPDATE ON flours_template
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

-- Make sure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
