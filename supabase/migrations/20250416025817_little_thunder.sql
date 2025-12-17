/*
  # Fix private flours relationship with categories

  1. Changes
    - Add foreign key constraint to private_flours table for private_flour_categories_id

  2. Security
    - No changes to RLS policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'private_flours_private_flour_categories_id_fkey'
  ) THEN
    ALTER TABLE private_flours
    ADD CONSTRAINT private_flours_private_flour_categories_id_fkey
    FOREIGN KEY (private_flour_categories_id) 
    REFERENCES private_flour_categories(id)
    ON DELETE SET NULL;
  END IF;
END $$;
