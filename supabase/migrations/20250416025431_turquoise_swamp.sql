/*
  # Fix private flours foreign key relationship

  1. Changes
    - Add foreign key constraint from private_flours.private_flour_categories_id to private_flour_categories.id
    - Add ON DELETE SET NULL to handle category deletion gracefully

  2. Security
    - No changes to RLS policies
*/

-- Add foreign key constraint with ON DELETE SET NULL
ALTER TABLE private_flours
DROP CONSTRAINT IF EXISTS private_flours_private_flour_categories_id_fkey;

ALTER TABLE private_flours
ADD CONSTRAINT private_flours_private_flour_categories_id_fkey
FOREIGN KEY (private_flour_categories_id)
REFERENCES private_flour_categories(id)
ON DELETE SET NULL;
