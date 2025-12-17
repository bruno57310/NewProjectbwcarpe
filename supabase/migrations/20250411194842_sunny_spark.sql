/*
  # Add foreign key relationship to private_flours

  1. Changes
    - Add foreign key constraint between private_flours and flour_categories tables
    - Ensure proper relationship for category lookups

  2. Security
    - No changes to security policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'private_flours_category_id_fkey'
  ) THEN
    ALTER TABLE private_flours
    ADD CONSTRAINT private_flours_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES flour_categories(id);
  END IF;
END $$;
