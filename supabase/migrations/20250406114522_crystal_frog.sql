/*
  # Move Crab Flour to Crustacean Category

  1. Changes
    - Move "Farine de Crabe" from "Non catégorisé" to "Farines de crustacés"
    - Log the change in the audit table

  2. Safety
    - Ensures target category exists before moving
    - Creates audit trail of the change
    - Uses transaction-safe PL/pgSQL block
*/

DO $$ 
DECLARE
  uncategorized_id uuid;
  crustacean_id uuid;
  moved_count integer;
BEGIN
  -- Get the ID of the 'Non catégorisé' category
  SELECT id INTO uncategorized_id
  FROM flour_categories
  WHERE name = 'Non catégorisé';

  -- Get or create 'Farines de crustacés' category
  SELECT id INTO crustacean_id
  FROM flour_categories
  WHERE name = 'Farines de crustacés';

  -- Create 'Farines de crustacés' if it doesn't exist
  IF crustacean_id IS NULL THEN
    INSERT INTO flour_categories (name, description)
    VALUES ('Farines de crustacés', 'Farines issues de crustacés')
    RETURNING id INTO crustacean_id;
  END IF;

  -- Move the crab flour to the crustacean category
  WITH moved_flours AS (
    UPDATE flours
    SET 
      category_id = crustacean_id,
      updated_at = now()
    WHERE 
      category_id = uncategorized_id
      AND name ILIKE 'Farine de Crabe'
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
    'Non catégorisé',
    'Farines de crustacés',
    moved_count
  );

  -- Raise notice with the number of items moved
  RAISE NOTICE 'Moved % flour items from Non catégorisé to Farines de crustacés', moved_count;
END $$;
