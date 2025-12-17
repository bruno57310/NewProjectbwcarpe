/*
  # Delete 'Farines de céréales' Category

  1. Changes
    - Move flours from 'Farines de céréales' to 'Farines végétales'
    - Delete 'Farines de céréales' category
    - Log the change in the audit table

  2. Safety
    - Ensures no data loss by moving flours to appropriate category
    - Creates audit trail of the changes
    - Uses transaction-safe PL/pgSQL block
*/

DO $$ 
DECLARE
  cereal_flours_id uuid;
  veg_flours_id uuid;
  moved_count integer;
BEGIN
  -- Get the ID of the 'Farines de céréales' category
  SELECT id INTO cereal_flours_id
  FROM flour_categories
  WHERE name = 'Farines de céréales';

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

  -- Move all flours from 'Farines de céréales' to 'Farines végétales'
  WITH moved_flours AS (
    UPDATE flours
    SET 
      category_id = veg_flours_id,
      updated_at = now()
    WHERE category_id = cereal_flours_id
    RETURNING id
  )
  SELECT COUNT(*) INTO moved_count
  FROM moved_flours;

  -- Log the change
  INSERT INTO category_changes (
    old_category_name,
    new_category_name,
    items_moved
  ) VALUES (
    'Farines de céréales',
    'Farines végétales',
    moved_count
  );

  -- Delete the 'Farines de céréales' category
  DELETE FROM flour_categories
  WHERE id = cereal_flours_id;

  -- Raise notice with the number of items moved
  RAISE NOTICE 'Moved % flour items from Farines de céréales to Farines végétales', moved_count;
END $$;
