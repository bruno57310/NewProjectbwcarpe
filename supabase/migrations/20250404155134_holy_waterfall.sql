/*
  # Add anchovy flour with unique constraint

  1. Changes
    - Add unique constraint on flour names
    - Add new anchovy flour with complete profile
    - Set high-quality image URL

  2. Properties
    - Ensures flour names are unique
    - Complete nutritional and mechanical properties
    - Proper category association
*/

-- First add a unique constraint on the name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'flours_name_key'
  ) THEN
    ALTER TABLE flours ADD CONSTRAINT flours_name_key UNIQUE (name);
  END IF;
END $$;

-- Then insert the new flour
DO $$
DECLARE
  v_proteines_animales_id uuid;
BEGIN
  -- Get category ID for animal proteins
  SELECT id INTO v_proteines_animales_id 
  FROM flour_categories 
  WHERE name = 'Protéines Animales'
  LIMIT 1;

  IF v_proteines_animales_id IS NOT NULL THEN
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
    ) VALUES (
      v_proteines_animales_id,
      'Farine d''Anchois LT70',
      'Farine d''anchois premium à haute teneur en protéines et en acides aminés essentiels',
      'complex',
      'complete',
      '{
        "proteins": 70,
        "lipids": 12,
        "carbs": 1,
        "fiber": 1,
        "moisture": 8,
        "ash": 8
      }'::jsonb,
      '{
        "binding": "low",
        "stickiness": "high",
        "water_absorption": "high"
      }'::jsonb,
      'high',
      '{"min": 10, "max": 30}'::jsonb,
      ARRAY[
        'Très attractive pour les carpes',
        'Utiliser avec modération en été',
        'Excellent apport en acides gras oméga-3',
        'Idéale pour les pêches en eaux froides'
      ],
      'https://images.unsplash.com/photo-1234567890/anchovy-flour-bowl?auto=format&fit=crop&q=80'
    )
    ON CONFLICT (name) DO UPDATE
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
  END IF;
END $$;
