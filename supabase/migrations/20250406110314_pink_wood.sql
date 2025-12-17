/*
  # Update Insect Flour Category

  1. Changes
    - Safely updates flours from "Farine d'insectes" to "Farines d'Insectes" category
    - Handles the case where target category already exists
    - Maintains data integrity during the transition
  
  2. Security
    - Maintains existing RLS policies
    - No security changes needed
*/

DO $$ 
DECLARE
  old_category_id uuid;
  new_category_id uuid;
BEGIN
  -- Get the ID of the old category
  SELECT id INTO old_category_id
  FROM flour_categories
  WHERE name = 'Farine d''insectes';

  -- Get the ID of the existing new category
  SELECT id INTO new_category_id
  FROM flour_categories
  WHERE name = 'Farines d''Insectes';

  -- If old category exists and new category exists, move flours and delete old
  IF old_category_id IS NOT NULL AND new_category_id IS NOT NULL THEN
    -- Update flours to use the new category ID
    UPDATE flours
    SET category_id = new_category_id
    WHERE category_id = old_category_id;

    -- Delete the old category
    DELETE FROM flour_categories
    WHERE id = old_category_id;
  END IF;
END $$;
