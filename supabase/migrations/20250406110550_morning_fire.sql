/*
  # Delete Insect Flour Category

  1. Changes
    - Safely deletes the "Farines d'insectes" category
    - Moves any associated flours to a default category to prevent data loss
    - Maintains referential integrity
  
  2. Security
    - Maintains existing RLS policies
    - No security changes needed

  Note: This migration ensures no flour data is lost during category deletion
*/

DO $$ 
DECLARE
  target_category_id uuid;
  default_category_id uuid;
BEGIN
  -- Get the ID of the category to delete
  SELECT id INTO target_category_id
  FROM flour_categories
  WHERE name = 'Farines d''insectes';

  -- If the category exists
  IF target_category_id IS NOT NULL THEN
    -- Get or create a default category for orphaned flours
    SELECT id INTO default_category_id
    FROM flour_categories
    WHERE name = 'Autres'
    LIMIT 1;

    -- Create 'Autres' category if it doesn't exist
    IF default_category_id IS NULL THEN
      INSERT INTO flour_categories (name, description)
      VALUES ('Autres', 'Catégorie par défaut pour les farines non classées')
      RETURNING id INTO default_category_id;
    END IF;

    -- Move any flours to the default category
    UPDATE flours
    SET category_id = default_category_id
    WHERE category_id = target_category_id;

    -- Delete the target category
    DELETE FROM flour_categories
    WHERE id = target_category_id;
  END IF;
END $$;
