/*
  # Add Crab Flour

  1. Changes
    - Add new crab flour with complete nutritional profile
    - Set appropriate mechanical properties and recommended ratios
    - Include detailed usage tips
    - Add high-quality image

  2. Properties
    - High protein content (68%)
    - Rich in chitin and minerals
    - Medium binding properties
    - High solubility for quick attraction
*/

DO $$
DECLARE
  v_proteines_animales_id uuid;
BEGIN
  -- Get category ID for animal proteins
  SELECT id INTO v_proteines_animales_id 
  FROM flour_categories 
  WHERE name = 'Protéines Animales'
  LIMIT 1;

  -- Insert crab flour
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
    'Farine de Crabe',
    'Farine de crabe premium, riche en protéines et en chitine, parfaite pour l''attractivité',
    'complex',
    'complete',
    '{
      "proteins": 68,
      "lipids": 8,
      "carbs": 2,
      "fiber": 12,
      "moisture": 6,
      "ash": 4
    }'::jsonb,
    '{
      "binding": "medium",
      "stickiness": "high",
      "water_absorption": "high"
    }'::jsonb,
    'high',
    '{"min": 5, "max": 20}'::jsonb,
    ARRAY[
      'Très attractive pour les carpes',
      'Riche en chitine naturelle',
      'Idéale pour les eaux froides',
      'Mélanger avec des farines de céréales pour une meilleure tenue'
    ],
    'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&q=80'
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
