/*
  # Add enzymatic composition and anti-nutrients to flours

  1. Changes
    - Add enzymatic_composition column (JSONB) to flours table
    - Add anti_nutrients column (JSONB) to flours table
    - Set default values for both columns
    - Update existing rows with default values

  2. Schema Details
    - enzymatic_composition: Contains percentages of different enzymes
      - amylases
      - proteases
      - lipases
      - phytases
    - anti_nutrients: Contains levels of different anti-nutrients
      - phytic_acid
      - tannins
      - trypsin_inhibitors
      - saponins
      - lectins
*/

-- Add new columns with default values
ALTER TABLE flours
ADD COLUMN enzymatic_composition jsonb DEFAULT '{
  "amylases": 0,
  "proteases": 0,
  "lipases": 0,
  "phytases": 0
}'::jsonb NOT NULL,
ADD COLUMN anti_nutrients jsonb DEFAULT '{
  "phytic_acid": "low",
  "tannins": "low",
  "trypsin_inhibitors": "low",
  "saponins": "low",
  "lectins": "low"
}'::jsonb NOT NULL;

-- Update values for specific flours
-- Farine de Blé T45
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 45,
    "proteases": 25,
    "lipases": 15,
    "phytases": 15
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "medium",
    "tannins": "low",
    "trypsin_inhibitors": "low",
    "saponins": "low",
    "lectins": "low"
  }'::jsonb
WHERE name = 'Farine de Blé T45';

-- Farine de Maïs
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 55,
    "proteases": 20,
    "lipases": 15,
    "phytases": 10
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "medium",
    "tannins": "low",
    "trypsin_inhibitors": "low",
    "saponins": "low",
    "lectins": "medium"
  }'::jsonb
WHERE name ILIKE '%Maïs%';

-- Farine de Soja
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 15,
    "proteases": 45,
    "lipases": 25,
    "phytases": 15
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "high",
    "tannins": "medium",
    "trypsin_inhibitors": "high",
    "saponins": "high",
    "lectins": "high"
  }'::jsonb
WHERE name ILIKE '%Soja%';

-- Farine d'Avoine
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 40,
    "proteases": 30,
    "lipases": 20,
    "phytases": 10
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "medium",
    "tannins": "low",
    "trypsin_inhibitors": "low",
    "saponins": "low",
    "lectins": "low"
  }'::jsonb
WHERE name ILIKE '%Avoine%';

-- Farine de Riz
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 60,
    "proteases": 20,
    "lipases": 10,
    "phytases": 10
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "medium",
    "tannins": "low",
    "trypsin_inhibitors": "low",
    "saponins": "low",
    "lectins": "low"
  }'::jsonb
WHERE name ILIKE '%Riz%';

-- Farine de Pois
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 25,
    "proteases": 40,
    "lipases": 20,
    "phytases": 15
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "medium",
    "tannins": "low",
    "trypsin_inhibitors": "medium",
    "saponins": "medium",
    "lectins": "medium"
  }'::jsonb
WHERE name ILIKE '%Pois%';

-- Farine de Lupin
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 20,
    "proteases": 45,
    "lipases": 25,
    "phytases": 10
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "medium",
    "tannins": "low",
    "trypsin_inhibitors": "medium",
    "saponins": "medium",
    "lectins": "high"
  }'::jsonb
WHERE name ILIKE '%Lupin%';

-- Farine de Chanvre
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 25,
    "proteases": 35,
    "lipases": 30,
    "phytases": 10
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "medium",
    "tannins": "low",
    "trypsin_inhibitors": "low",
    "saponins": "low",
    "lectins": "low"
  }'::jsonb
WHERE name ILIKE '%Chanvre%';

-- Protéines animales
UPDATE flours 
SET 
  enzymatic_composition = '{
    "amylases": 10,
    "proteases": 60,
    "lipases": 25,
    "phytases": 5
  }'::jsonb,
  anti_nutrients = '{
    "phytic_acid": "low",
    "tannins": "low",
    "trypsin_inhibitors": "low",
    "saponins": "low",
    "lectins": "low"
  }'::jsonb
WHERE category_id IN (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Protéines Animales'
);
