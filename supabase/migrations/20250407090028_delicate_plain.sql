/*
  # Create flours_template table

  1. New Table
    - `flours_template`: Identical structure to `flours` table but without data
    - All columns, constraints, and indexes from original table
    - Enables RLS with same policies as flours table

  2. Security
    - Enable RLS
    - Copy existing policies from flours table
    - Maintain same security model
*/

-- Create flours_template table with identical structure
CREATE TABLE IF NOT EXISTS flours_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES flour_categories(id),
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

-- Add unique constraint on name
ALTER TABLE flours_template
ADD CONSTRAINT flours_template_name_key UNIQUE (name);

-- Add check constraint for protein composition
ALTER TABLE flours_template
ADD CONSTRAINT check_protein_composition_sum_template
CHECK (
  (protein_composition->>'albumins')::numeric +
  (protein_composition->>'globulins')::numeric +
  (protein_composition->>'prolamins')::numeric +
  (protein_composition->>'glutelins')::numeric = 100
);

-- Enable RLS
ALTER TABLE flours_template ENABLE ROW LEVEL SECURITY;

-- Create same policies as flours table
CREATE POLICY "Allow paid subscribers to access full flour template details"
  ON flours_template
  FOR SELECT
  TO authenticated
  USING (has_paid_subscription(auth.uid()));

CREATE POLICY "Allow preview access to flour templates"
  ON flours_template
  FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flours_template_category_id ON flours_template(category_id);
CREATE INDEX IF NOT EXISTS idx_flours_template_protein_profile ON flours_template(protein_profile);
CREATE INDEX IF NOT EXISTS idx_flours_template_protein_quality ON flours_template(protein_quality);
CREATE INDEX IF NOT EXISTS idx_flours_template_solubility ON flours_template(solubility);

-- Create trigger for updated_at
CREATE TRIGGER update_flours_template_updated_at
  BEFORE UPDATE ON flours_template
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
