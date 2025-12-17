/*
  # Delete legumes and oilseed categories

  1. Changes
    - Delete "Farines de légumineuses" and "Farines d'oléagineux" categories
    - Move their flours to "Farines végétales"
    - Log changes in category_changes table

  2. Safety
    - Ensures no flours become orphaned
    - Maintains data integrity with foreign key relationships
    - Logs all changes for auditing
*/

DO $$ 
DECLARE
  legumes_id uuid;
  oleagineux_id uuid;
  veg_flours_id uuid;
  moved_count_legumes integer := 0;
  moved_count_oleagineux integer := 0;
BEGIN
  -- Get category IDs
  SELECT id INTO legumes_id
  FROM flour_categories
  WHERE name = 'Farines de légumineuses';

  SELECT id INTO oleagineux_id
  FROM flour_categories
  WHERE name = 'Farines d''oléagineux';

  -- Get or create 'Farines végétales' category
  SELECT id INTO veg_flours_id
  FROM flour_categories
  WHERE name = 'Farines végétales';

  -- Create 'Farines végétales' if it doesn't exist
  IF veg_flours_id IS NULL THEN
    INSERT INTO flour_categories (name, description)
    VALUES ('Farines végétales', 'Farines issues de végétaux')
    RETURNING id INTO veg_flours_id;
  END IF;

  -- Move flours from légumineuses if it exists
  IF legumes_id IS NOT NULL THEN
    WITH moved_flours AS (
      UPDATE flours
      SET 
        category_id = veg_flours_id,
        updated_at = now()
      WHERE category_id = legumes_id
      RETURNING id
    )
    SELECT COUNT(*) INTO moved_count_legumes
    FROM moved_flours;

    -- Log the change
    IF moved_count_legumes > 0 THEN
      INSERT INTO category_changes (
        old_category_name,
        new_category_name,
        items_moved
      ) VALUES (
        'Farines de légumineuses',
        'Farines végétales',
        moved_count_legumes
      );
    END IF;

    -- Delete the category
    DELETE FROM flour_categories
    WHERE id = legumes_id;
  END IF;

  -- Move flours from oléagineux if it exists
  IF oleagineux_id IS NOT NULL THEN
    WITH moved_flours AS (
      UPDATE flours
      SET 
        category_id = veg_flours_id,
        updated_at = now()
      WHERE category_id = oleagineux_id
      RETURNING id
    )
    SELECT COUNT(*) INTO moved_count_oleagineux
    FROM moved_flours;

    -- Log the change
    IF moved_count_oleagineux > 0 THEN
      INSERT INTO category_changes (
        old_category_name,
        new_category_name,
        items_moved
      ) VALUES (
        'Farines d''oléagineux',
        'Farines végétales',
        moved_count_oleagineux
      );
    END IF;

    -- Delete the category
    DELETE FROM flour_categories
    WHERE id = oleagineux_id;
  END IF;

  -- Raise notice with the results
  RAISE NOTICE 'Moved % flours from légumineuses and % flours from oléagineux to Farines végétales',
    moved_count_legumes, moved_count_oleagineux;
END $$;
