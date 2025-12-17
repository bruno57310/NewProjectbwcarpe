/*
  # Fix private_flours foreign key relationship

  1. Changes
    - Drop existing foreign key constraint if it exists
    - Add proper foreign key constraint from private_flours.private_flour_categories_id to private_flour_categories.id
    - Add ON DELETE SET NULL to handle category deletion gracefully
    - Create index for better query performance

  2. Security
    - No changes to RLS policies
*/

-- Drop existing foreign key constraint if it exists
ALTER TABLE private_flours 
DROP CONSTRAINT IF EXISTS private_flours_private_flour_categories_id_fkey;

-- Add the new foreign key constraint
ALTER TABLE private_flours
ADD CONSTRAINT private_flours_private_flour_categories_id_fkey
FOREIGN KEY (private_flour_categories_id) 
REFERENCES private_flour_categories(id)
ON DELETE SET NULL;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_private_flours_private_flour_categories_id 
ON private_flours(private_flour_categories_id);
