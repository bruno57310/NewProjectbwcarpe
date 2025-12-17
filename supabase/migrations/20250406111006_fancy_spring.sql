/*
  # Delete 'Autres' category

  1. Changes
    - Delete the 'Autres' category
    - Move any flours in this category to 'Non catégorisé'
  
  2. Notes
    - Creates 'Non catégorisé' category if it doesn't exist
    - Ensures no flours become orphaned
*/

DO $$ 
DECLARE
  autres_category_id uuid;
  uncategorized_id uuid;
BEGIN
  -- Get the ID of the 'Autres' category
  SELECT id INTO autres_category_id
  FROM flour_categories
  WHERE name = 'Autres';

  -- Only proceed if 'Autres' category exists
  IF autres_category_id IS NOT NULL THEN
    -- Get or create 'Non catégorisé' category
    SELECT id INTO uncategorized_id
    FROM flour_categories
    WHERE name = 'Non catégorisé'
    LIMIT 1;

    -- Create 'Non catégorisé' if it doesn't exist
    IF uncategorized_id IS NULL THEN
      INSERT INTO flour_categories (name, description)
      VALUES ('Non catégorisé', 'Farines sans catégorie spécifique')
      RETURNING id INTO uncategorized_id;
    END IF;

    -- Move flours to 'Non catégorisé'
    UPDATE flours
    SET category_id = uncategorized_id
    WHERE category_id = autres_category_id;

    -- Delete the 'Autres' category
    DELETE FROM flour_categories
    WHERE id = autres_category_id;
  END IF;
END $$;
