/*
  # Delete 'Farines animales terrestres' category

  1. Changes
    - Move flours from 'Farines animales terrestres' to 'Non catégorisé'
    - Delete the 'Farines animales terrestres' category

  2. Safety
    - Ensures no flours become orphaned
    - Uses transaction-safe PL/pgSQL block
    - Checks for existence of categories before operations
*/

DO $$ 
DECLARE
  animal_category_id uuid;
  uncategorized_id uuid;
BEGIN
  -- Get the ID of the 'Farines animales terrestres' category
  SELECT id INTO animal_category_id
  FROM flour_categories
  WHERE name = 'Farines animales terrestres';

  -- Only proceed if the category exists
  IF animal_category_id IS NOT NULL THEN
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
    WHERE category_id = animal_category_id;

    -- Delete the 'Farines animales terrestres' category
    DELETE FROM flour_categories
    WHERE id = animal_category_id;
  END IF;
END $$;
