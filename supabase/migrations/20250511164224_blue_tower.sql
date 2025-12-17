/*
  # Fix updated_at trigger for flours_template table

  1. Changes
    - Drop and recreate the update_updated_at_column function
    - Drop and recreate the update_flours_template_updated_at trigger
    - Ensure the updated_at column has a default value and is not null
    
  2. Security
    - No changes to RLS policies
*/

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS update_flours_template_updated_at ON flours_template;

-- Recreate the update_updated_at_column function with better error handling
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the NEW record has an updated_at column
  IF TG_OP = 'UPDATE' THEN
    -- Set updated_at to current timestamp
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN undefined_column THEN
    -- If the column doesn't exist, just return the record as is
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the updated_at column exists and has the right properties
DO $$ 
BEGIN
  -- Check if updated_at column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'flours_template' 
    AND column_name = 'updated_at'
  ) THEN
    -- Add the updated_at column
    ALTER TABLE flours_template 
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  ELSE
    -- Make sure it has the right properties
    ALTER TABLE flours_template 
    ALTER COLUMN updated_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET NOT NULL;
  END IF;
END $$;

-- Create the trigger again
CREATE TRIGGER update_flours_template_updated_at
BEFORE UPDATE ON flours_template
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update any NULL updated_at values
UPDATE flours_template
SET updated_at = now()
WHERE updated_at IS NULL;
