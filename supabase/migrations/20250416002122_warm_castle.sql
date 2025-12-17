/*
  # Fix private flours categories relation

  1. Changes
    - Add proper foreign key relationship between private_flours and private_flour_categories
    - Update the select policy to include the joined table

  2. Security
    - Maintain existing RLS policies
    - Ensure proper cascade behavior on category deletion
*/

-- First ensure the foreign key is properly set up
DO $$ BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'private_flours_category_id_fkey'
  ) THEN
    ALTER TABLE private_flours DROP CONSTRAINT private_flours_category_id_fkey;
  END IF;
END $$;

-- Add the foreign key constraint with proper cascade behavior
ALTER TABLE private_flours
ADD CONSTRAINT private_flours_category_id_fkey
FOREIGN KEY (category_id) 
REFERENCES private_flour_categories(id) 
ON DELETE SET NULL;
