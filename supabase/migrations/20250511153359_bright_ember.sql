/*
  # Fix updated_at field in flours and flours_template tables

  1. Changes
    - Ensure updated_at column exists in both tables
    - Add trigger to automatically update the field on record update
    - Verify update_updated_at_column function exists
    
  2. Details
    - Checks if columns exist before attempting to add them
    - Creates triggers if they don't exist
    - Ensures consistent behavior across tables
*/

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check and fix flours table
DO $$ 
BEGIN
  -- Check if updated_at column exists in flours table
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'flours' 
    AND column_name = 'updated_at'
  ) THEN
    -- Add the updated_at column
    ALTER TABLE flours 
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
  
  -- Ensure the trigger exists for flours table
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_flours_updated_at'
    AND tgrelid = 'flours'::regclass
  ) THEN
    CREATE TRIGGER update_flours_updated_at
    BEFORE UPDATE ON flours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Check and fix flours_template table
DO $$ 
BEGIN
  -- Check if updated_at column exists in flours_template table
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'flours_template' 
    AND column_name = 'updated_at'
  ) THEN
    -- Add the updated_at column
    ALTER TABLE flours_template 
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
  
  -- Ensure the trigger exists for flours_template table
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_flours_template_updated_at'
    AND tgrelid = 'flours_template'::regclass
  ) THEN
    CREATE TRIGGER update_flours_template_updated_at
    BEFORE UPDATE ON flours_template
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Update any existing records with NULL updated_at values
UPDATE flours
SET updated_at = now()
WHERE updated_at IS NULL;

UPDATE flours_template
SET updated_at = now()
WHERE updated_at IS NULL;
