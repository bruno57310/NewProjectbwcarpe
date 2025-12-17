-- Farine de Blé T45 (Wheat flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 12,
  "proteases": 8,
  "lipases": 5,
  "phytases": 3
}'::jsonb
WHERE name = 'Farine de Blé T45';

-- Farine de Maïs (Corn flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 15,
  "proteases": 6,
  "lipases": 4,
  "phytases": 2
}'::jsonb
WHERE name ILIKE '%Maïs%';

-- Farine de Soja (Soybean flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 8,
  "proteases": 18,
  "lipases": 12,
  "phytases": 7
}'::jsonb
WHERE name ILIKE '%Soja%';

-- Farine d'Avoine (Oat flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 10,
  "proteases": 7,
  "lipases": 8,
  "phytases": 4
}'::jsonb
WHERE name ILIKE '%Avoine%';

-- Farine de Riz (Rice flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 14,
  "proteases": 5,
  "lipases": 3,
  "phytases": 2
}'::jsonb
WHERE name ILIKE '%Riz%';

-- Farine de Pois (Pea flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 9,
  "proteases": 15,
  "lipases": 6,
  "phytases": 5
}'::jsonb
WHERE name ILIKE '%Pois%';

-- Farine de Lupin (Lupin flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 7,
  "proteases": 16,
  "lipases": 9,
  "phytases": 6
}'::jsonb
WHERE name ILIKE '%Lupin%';

-- Farine de Chanvre (Hemp flour)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 6,
  "proteases": 12,
  "lipases": 14,
  "phytases": 5
}'::jsonb
WHERE name ILIKE '%Chanvre%';

-- Animal proteins (fish, shrimp, krill, etc.)
UPDATE flours 
SET enzymatic_composition = '{
  "amylases": 4,
  "proteases": 20,
  "lipases": 15,
  "phytases": 2
}'::jsonb
WHERE category_id IN (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Protéines Animales'
);
