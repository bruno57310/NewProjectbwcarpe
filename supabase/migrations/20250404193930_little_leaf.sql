/*
  # Add Black Soldier Fly Flour

  1. Changes
    - Add new flour: Farine de mouche noir soldat
    - Category: Farine d'insectes
    - Include nutritional values and properties

  2. Security
    - Inherits existing RLS policies from flours table
*/

-- First, ensure the category exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM flour_categories 
    WHERE name = 'Farine d''insectes'
  ) THEN
    INSERT INTO flour_categories (name, description)
    VALUES (
      'Farine d''insectes',
      'Farines produites à partir d''insectes, riches en protéines et durables'
    );
  END IF;
END $$;

-- Get the category ID
WITH category_id AS (
  SELECT id FROM flour_categories WHERE name = 'Farine d''insectes'
)
INSERT INTO flours (
  name,
  category_id,
  description,
  protein_profile,
  protein_quality,
  nutritional_values,
  mechanical_properties,
  solubility,
  recommended_ratio,
  tips,
  image_url
)
SELECT
  'Farine de mouche noir soldat',
  category_id.id,
  'Farine issue de la mouche soldat noire (Hermetia illucens), riche en protéines et durable.',
  'complex',
  'complete',
  jsonb_build_object(
    'proteins', 45,
    'lipids', 35,
    'carbs', 5,
    'fiber', 7,
    'moisture', 5,
    'ash', 3
  ),
  jsonb_build_object(
    'binding', 'medium',
    'stickiness', 'low',
    'water_absorption', 'medium'
  ),
  'medium',
  jsonb_build_object(
    'min', 5,
    'max', 30
  ),
  ARRAY[
    'Excellente source de protéines',
    'Riche en acides gras essentiels',
    'À utiliser en complément des farines végétales',
    'Idéal pour les mix protéinés'
  ],
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80'
FROM category_id
WHERE NOT EXISTS (
  SELECT 1 FROM flours WHERE name = 'Farine de mouche noir soldat'
);
