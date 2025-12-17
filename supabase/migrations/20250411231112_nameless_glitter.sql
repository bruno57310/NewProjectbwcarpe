/*
  # Create Demo Tables for Free Users

  1. New Tables
    - `flours_categories_demo`: Copy of flour_categories
    - `flours_demo`: Copy of flours with filtered data
    
  2. Data Migration
    - Copy all categories
    - Copy only flours from 'Farines végétales' and 'Farines de poisson'
    
  3. Security
    - Enable RLS
    - Allow public read access
*/

-- Create demo categories table
CREATE TABLE IF NOT EXISTS flour_categories_demo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create demo flours table
CREATE TABLE IF NOT EXISTS flours_demo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES flour_categories_demo(id),
  name text NOT NULL,
  description text,
  protein_profile text CHECK (protein_profile IN ('simple', 'complex')),
  protein_quality text CHECK (protein_quality IN ('complete', 'incomplete')),
  nutritional_values jsonb NOT NULL DEFAULT '{
    "proteins": 0,
    "lipids": 0,
    "carbs": 0,
    "fiber": 0,
    "moisture": 0,
    "ash": 0
  }'::jsonb,
  protein_composition jsonb NOT NULL DEFAULT '{
    "albumins": 25,
    "globulins": 25,
    "prolamins": 25,
    "glutelins": 25
  }'::jsonb,
  enzymatic_composition jsonb NOT NULL DEFAULT '{
    "amylases": 0,
    "proteases": 0,
    "lipases": 0,
    "phytases": 0
  }'::jsonb,
  mechanical_properties jsonb NOT NULL DEFAULT '{
    "binding": "medium",
    "stickiness": "medium",
    "water_absorption": "medium"
  }'::jsonb,
  anti_nutrients jsonb NOT NULL DEFAULT '{
    "phytic_acid": "low",
    "tannins": "low",
    "trypsin_inhibitors": "low",
    "saponins": "low",
    "lectins": "low"
  }'::jsonb,
  solubility text CHECK (solubility IN ('low', 'medium', 'high')),
  recommended_ratio jsonb NOT NULL DEFAULT '{"min": 0, "max": 100}'::jsonb,
  tips text[] DEFAULT ARRAY[]::text[],
  image_url text,
  price_per_kg numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE flour_categories_demo ENABLE ROW LEVEL SECURITY;
ALTER TABLE flours_demo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access to demo categories"
  ON flour_categories_demo
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to demo flours"
  ON flours_demo
  FOR SELECT
  TO public
  USING (true);

-- Copy categories data
INSERT INTO flour_categories_demo (name, description, image_url)
SELECT name, description, image_url
FROM flour_categories;

-- Copy flours data from specified categories
WITH target_categories AS (
  SELECT id 
  FROM flour_categories 
  WHERE name IN ('Farines végétales', 'Farines de poisson')
),
target_categories_demo AS (
  SELECT id, name 
  FROM flour_categories_demo 
  WHERE name IN ('Farines végétales', 'Farines de poisson')
)
INSERT INTO flours_demo (
  name,
  category_id,
  description,
  protein_profile,
  protein_quality,
  nutritional_values,
  protein_composition,
  enzymatic_composition,
  mechanical_properties,
  anti_nutrients,
  solubility,
  recommended_ratio,
  tips,
  image_url,
  price_per_kg
)
SELECT 
  f.name,
  cd.id as category_id,
  f.description,
  f.protein_profile,
  f.protein_quality,
  f.nutritional_values,
  f.protein_composition,
  f.enzymatic_composition,
  f.mechanical_properties,
  f.anti_nutrients,
  f.solubility,
  f.recommended_ratio,
  f.tips,
  f.image_url,
  f.price_per_kg
FROM flours f
JOIN target_categories tc ON f.category_id = tc.id
JOIN flour_categories fc ON tc.id = fc.id
JOIN flour_categories_demo cd ON fc.name = cd.name;

-- Add constraints
ALTER TABLE flours_demo
ADD CONSTRAINT check_protein_composition_sum
CHECK (
  (protein_composition->>'albumins')::numeric +
  (protein_composition->>'globulins')::numeric +
  (protein_composition->>'prolamins')::numeric +
  (protein_composition->>'glutelins')::numeric = 100
);

ALTER TABLE flours_demo
ADD CONSTRAINT check_mechanical_properties_values
CHECK (
  (mechanical_properties->>'binding')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'stickiness')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'water_absorption')::text IN ('low', 'medium', 'high')
);

-- Create indexes
CREATE INDEX idx_flours_demo_category_id ON flours_demo(category_id);
CREATE INDEX idx_flours_demo_protein_profile ON flours_demo(protein_profile);
CREATE INDEX idx_flours_demo_protein_quality ON flours_demo(protein_quality);
CREATE INDEX idx_flours_demo_solubility ON flours_demo(solubility);

-- Create trigger for updated_at
CREATE TRIGGER update_flours_demo_updated_at
  BEFORE UPDATE ON flours_demo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
