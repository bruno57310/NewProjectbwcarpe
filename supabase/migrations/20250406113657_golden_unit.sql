/*
  # Move Cereal Flours to Vegetable Flours Category

  1. Changes
    - Create 'Farines végétales' category if it doesn't exist
    - Move all flours from 'Céréales' to 'Farines végétales'
    - Delete 'Céréales' category
    - Log the change in a new audit table

  2. Safety
    - Ensures no data loss during category transition
    - Creates audit trail of the changes
    - Uses transaction-safe PL/pgSQL block
*/

-- First, create an audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS category_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_category_name text NOT NULL,
  new_category_name text NOT NULL,
  items_moved integer NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by text DEFAULT current_user
);

DO $$ 
DECLARE
  cereales_id uuid;
  farines_veg_id uuid;
  moved_count integer;
BEGIN
  -- Get the ID of the 'Céréales' category
  SELECT id INTO cereales_id
  FROM flour_categories
  WHERE name = 'Céréales';

  -- Get or create 'Farines végétales' category
  SELECT id INTO farines_veg_id
  FROM flour_categories
  WHERE name = 'Farines végétales';

  -- Create 'Farines végétales' if it doesn't exist
  IF farines_veg_id IS NULL THEN
    INSERT INTO flour_categories (name, description)
    VALUES ('Farines végétales', 'Farines issues de végétaux')
    RETURNING id INTO farines_veg_id;
  END IF;

  -- Move all flours from 'Céréales' to 'Farines végétales'
  WITH moved_flours AS (
    UPDATE flours
    SET 
      category_id = farines_veg_id,
      updated_at = now()
    WHERE category_id = cereales_id
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
    'Céréales',
    'Farines végétales',
    moved_count
  );

  -- Delete the 'Céréales' category
  DELETE FROM flour_categories
  WHERE id = cereales_id;

  -- Raise notice with the number of items moved
  RAISE NOTICE 'Moved % flour items from Céréales to Farines végétales', moved_count;
END $$;
