/*
  # Delete Non catégorisé Category

  1. Changes
    - Move any flours from "Non catégorisé" to appropriate categories
    - Delete the "Non catégorisé" category
    - Log changes in the audit table

  2. Safety
    - Ensures no flours are orphaned
    - Creates audit trail of the changes
    - Uses transaction-safe PL/pgSQL block
*/

DO $$ 
DECLARE
  uncategorized_id uuid;
  veg_flours_id uuid;
  moved_count integer;
BEGIN
  -- Get the ID of the 'Non catégorisé' category
  SELECT id INTO uncategorized_id
  FROM flour_categories
  WHERE name = 'Non catégorisé';

  -- Only proceed if the category exists
  IF uncategorized_id IS NOT NULL THEN
    -- Get or create 'Farines végétales' category for any remaining flours
    SELECT id INTO veg_flours_id
    FROM flour_categories
    WHERE name = 'Farines végétales';

    -- Create 'Farines végétales' if it doesn't exist
    IF veg_flours_id IS NULL THEN
      INSERT INTO flour_categories (name, description)
      VALUES ('Farines végétales', 'Farines issues de végétaux')
      RETURNING id INTO veg_flours_id;
    END IF;

    -- Move remaining flours to 'Farines végétales'
    WITH moved_flours AS (
      UPDATE flours
      SET 
        category_id = veg_flours_id,
        updated_at = now()
      WHERE category_id = uncategorized_id
      RETURNING id
    )
    SELECT COUNT(*) INTO moved_count
    FROM moved_flours;

    -- Log the change
    IF moved_count > 0 THEN
      INSERT INTO category_changes (
        old_category_name,
        new_category_name,
        items_moved
      ) VALUES (
        'Non catégorisé',
        'Farines végétales',
        moved_count
      );
    END IF;

    -- Delete the 'Non catégorisé' category
    DELETE FROM flour_categories
    WHERE id = uncategorized_id;

    -- Raise notice with the number of items moved
    RAISE NOTICE 'Moved % flour items from Non catégorisé to Farines végétales', moved_count;
  END IF;
END $$;
