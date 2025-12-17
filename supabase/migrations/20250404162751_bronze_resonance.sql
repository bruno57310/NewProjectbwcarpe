/*
  # Add Crustacean Flours Category

  1. New Category
    - Add 'Farines de Crustacés' category
    - Move crab flour to new category
    - Update category image

  2. Changes
    - Create new category
    - Update crab flour's category
*/

-- Add the new category
INSERT INTO flour_categories (name, description, image_url)
VALUES (
  'Farines de Crustacés',
  'Farines issues de crustacés, riches en protéines et en chitine naturelle',
  'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&q=80'
)
ON CONFLICT (name)
DO UPDATE
SET 
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- Move crab flour to new category
DO $$
DECLARE
  v_category_id uuid;
BEGIN
  -- Get the new category ID
  SELECT id INTO v_category_id 
  FROM flour_categories 
  WHERE name = 'Farines de Crustacés'
  LIMIT 1;

  -- Update crab flour category
  IF v_category_id IS NOT NULL THEN
    UPDATE flours 
    SET category_id = v_category_id
    WHERE name = 'Farine de Crabe';
  END IF;
END $$;
