/*
  # Remove Crustacean Flours Category

  1. Changes
    - Move all flours from 'Farines de Crustacés' to 'Protéines Animales'
    - Remove the 'Farines de Crustacés' category
    
  2. Implementation Details
    - First update all flours to new category
    - Then safely delete the old category
    - Uses transaction to ensure data consistency
*/

BEGIN;

-- Move all flours to the animal proteins category first
UPDATE flours 
SET category_id = (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Protéines Animales'
  LIMIT 1
)
WHERE category_id = (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Farines de Crustacés'
  LIMIT 1
);

-- Now we can safely delete the category
DELETE FROM flour_categories 
WHERE name = 'Farines de Crustacés';

COMMIT;
