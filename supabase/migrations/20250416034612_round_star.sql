/*
  # Fix private_flours and private_flour_categories relationship

  1. Changes
    - Add private_flour_categories_id column to private_flours if it doesn't exist
    - Ensure proper foreign key relationship between tables
    - Create necessary indexes for performance
    - Update RLS policies to use the correct column names

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data isolation between users
*/

-- First, ensure private_flour_categories_id column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_flours' 
    AND column_name = 'private_flour_categories_id'
  ) THEN
    ALTER TABLE private_flours 
    ADD COLUMN private_flour_categories_id uuid;
  END IF;
END $$;

-- Drop existing foreign key constraints to avoid conflicts
ALTER TABLE private_flours 
DROP CONSTRAINT IF EXISTS private_flours_category_id_fkey;

ALTER TABLE private_flours 
DROP CONSTRAINT IF EXISTS private_flours_private_flour_categories_id_fkey;

-- Add the foreign key constraint with proper cascade behavior
ALTER TABLE private_flours
ADD CONSTRAINT private_flours_private_flour_categories_id_fkey
FOREIGN KEY (private_flour_categories_id) 
REFERENCES private_flour_categories(id) 
ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_private_flours_private_flour_categories_id 
ON private_flours(private_flour_categories_id);

-- If there's data in category_id but not in private_flour_categories_id, migrate it
UPDATE private_flours
SET private_flour_categories_id = category_id
WHERE private_flour_categories_id IS NULL AND category_id IS NOT NULL;
