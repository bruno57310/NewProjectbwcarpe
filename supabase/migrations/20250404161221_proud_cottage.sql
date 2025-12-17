/*
  # Add Insect Flours Category and Products

  1. New Category
    - Add "Farines d'Insectes" category with description and image
    - Create unique constraint on category name

  2. New Flours
    - Add 5 new insect-based flours with complete nutritional profiles
    - Include detailed descriptions and usage tips
    - Set appropriate mechanical properties and recommended ratios

  3. Properties
    - All flours have high protein content
    - Specific mechanical properties for each type
    - Detailed usage recommendations
*/

-- Add unique constraint to flour_categories if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'flour_categories_name_key'
  ) THEN
    ALTER TABLE flour_categories ADD CONSTRAINT flour_categories_name_key UNIQUE (name);
  END IF;
END $$;

-- First, add the new category if it doesn't exist
INSERT INTO flour_categories (name, description, image_url)
VALUES (
  'Farines d''Insectes',
  'Farines à base d''insectes, riches en protéines et écologiques',
  'https://images.unsplash.com/photo-1600441397207-96c88e11052f?auto=format&fit=crop&q=80'
)
ON CONFLICT (name)
DO UPDATE
SET 
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- Get the category ID
DO $$
DECLARE
  v_category_id uuid;
BEGIN
  SELECT id INTO v_category_id FROM flour_categories WHERE name = 'Farines d''Insectes';

  -- Insert new insect flours
  INSERT INTO flours (
    category_id,
    name,
    description,
    protein_profile,
    protein_quality,
    nutritional_values,
    mechanical_properties,
    solubility,
    recommended_ratio,
    tips,
    image_url
  ) VALUES 
  (
    v_category_id,
    'Farine de Grillon',
    'Farine de grillons domestiques, excellente source de protéines complètes et de vitamine B12',
    'complex',
    'complete',
    '{
      "proteins": 65,
      "lipids": 20,
      "carbs": 5,
      "fiber": 6,
      "moisture": 2,
      "ash": 2
    }'::jsonb,
    '{
      "binding": "medium",
      "stickiness": "low",
      "water_absorption": "medium"
    }'::jsonb,
    'medium',
    '{"min": 5, "max": 25}'::jsonb,
    ARRAY[
      'Excellente source de protéines complètes',
      'Riche en chitine pour stimuler le système immunitaire',
      'Idéal pour les pêches en eaux chaudes',
      'Mélanger avec des farines végétales pour optimiser l''attractivité'
    ],
    'https://images.unsplash.com/photo-1600441397207-96c88e11052f?auto=format&fit=crop&q=80'
  ),
  (
    v_category_id,
    'Farine de Ver de Farine',
    'Farine de larves de ténébrion meunier, riche en protéines et acides gras essentiels',
    'complex',
    'complete',
    '{
      "proteins": 55,
      "lipids": 30,
      "carbs": 5,
      "fiber": 5,
      "moisture": 3,
      "ash": 2
    }'::jsonb,
    '{
      "binding": "high",
      "stickiness": "medium",
      "water_absorption": "low"
    }'::jsonb,
    'low',
    '{"min": 10, "max": 30}'::jsonb,
    ARRAY[
      'Très digestible pour les carpes',
      'Excellent rapport qualité-prix',
      'Parfait pour les eaux froides',
      'Combiner avec des farines de céréales pour une meilleure tenue'
    ],
    'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&q=80'
  ),
  (
    v_category_id,
    'Farine de Criquet',
    'Farine de criquets migrateurs, haute teneur en protéines et minéraux',
    'complex',
    'complete',
    '{
      "proteins": 70,
      "lipids": 15,
      "carbs": 8,
      "fiber": 4,
      "moisture": 2,
      "ash": 1
    }'::jsonb,
    '{
      "binding": "medium",
      "stickiness": "medium",
      "water_absorption": "medium"
    }'::jsonb,
    'medium',
    '{"min": 5, "max": 20}'::jsonb,
    ARRAY[
      'Très attractive en été',
      'Riche en acides aminés essentiels',
      'Excellente digestibilité',
      'Idéale en mix avec des farines de poisson'
    ],
    'https://images.unsplash.com/photo-1584180471422-c59341b3c25c?auto=format&fit=crop&q=80'
  ),
  (
    v_category_id,
    'Farine de Scarabée',
    'Farine de scarabées rhinocéros, concentrée en protéines et chitine',
    'complex',
    'complete',
    '{
      "proteins": 60,
      "lipids": 25,
      "carbs": 6,
      "fiber": 5,
      "moisture": 2,
      "ash": 2
    }'::jsonb,
    '{
      "binding": "high",
      "stickiness": "low",
      "water_absorption": "low"
    }'::jsonb,
    'low',
    '{"min": 5, "max": 15}'::jsonb,
    ARRAY[
      'Forte attractivité naturelle',
      'Excellente source de chitine',
      'Parfaite pour les eaux profondes',
      'À utiliser en faible quantité pour maximiser l''efficacité'
    ],
    'https://images.unsplash.com/photo-1582556825411-c24d5de157c5?auto=format&fit=crop&q=80'
  ),
  (
    v_category_id,
    'Farine de Bombyx',
    'Farine de chrysalides de ver à soie, riche en protéines solubles',
    'complex',
    'complete',
    '{
      "proteins": 58,
      "lipids": 28,
      "carbs": 4,
      "fiber": 6,
      "moisture": 2,
      "ash": 2
    }'::jsonb,
    '{
      "binding": "medium",
      "stickiness": "high",
      "water_absorption": "high"
    }'::jsonb,
    'high',
    '{"min": 10, "max": 25}'::jsonb,
    ARRAY[
      'Très soluble dans l''eau',
      'Libération rapide des attractants',
      'Idéale pour la pêche active',
      'Excellente en mix avec des farines de céréales'
    ],
    'https://images.unsplash.com/photo-1566755272146-7d32a1f8d3cc?auto=format&fit=crop&q=80'
  )
  ON CONFLICT (name)
  DO UPDATE
  SET 
    description = EXCLUDED.description,
    protein_profile = EXCLUDED.protein_profile,
    protein_quality = EXCLUDED.protein_quality,
    nutritional_values = EXCLUDED.nutritional_values,
    mechanical_properties = EXCLUDED.mechanical_properties,
    solubility = EXCLUDED.solubility,
    recommended_ratio = EXCLUDED.recommended_ratio,
    tips = EXCLUDED.tips,
    image_url = EXCLUDED.image_url;
END $$;
