-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_flours_template_updated_at ON flours_template;

-- Ensure the update_updated_at_column function exists and works correctly
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again
CREATE TRIGGER update_flours_template_updated_at
BEFORE UPDATE ON flours_template
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Make sure the updated_at column exists and has a default value
ALTER TABLE flours_template 
ALTER COLUMN updated_at SET DEFAULT now();

-- Update any NULL updated_at values
UPDATE flours_template
SET updated_at = now()
WHERE updated_at IS NULL;
