/*
  # Add private_flours table for Enterprise users

  1. New Table
    - `private_flours`: Similar structure to `flours` but with user_id
    - All columns from flours table
    - Additional user_id column for ownership
    - RLS policies for user-specific access

  2. Security
    - Enable RLS
    - Only Enterprise subscribers can access
    - Users can only access their own private flours
*/

-- Create private_flours table
CREATE TABLE IF NOT EXISTS private_flours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE private_flours ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own private flours"
  ON private_flours
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
      AND tier = 'enterprise'
      AND active = true
      AND current_period_end > now()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
      AND tier = 'enterprise'
      AND active = true
      AND current_period_end > now()
    )
  );

-- Create indexes
CREATE INDEX idx_private_flours_user_id ON private_flours(user_id);
CREATE INDEX idx_private_flours_category_id ON private_flours(category_id);

-- Create trigger for updated_at
CREATE TRIGGER update_private_flours_updated_at
  BEFORE UPDATE ON private_flours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE private_flours
ADD CONSTRAINT check_protein_composition_sum
CHECK (
  (protein_composition->>'albumins')::numeric +
  (protein_composition->>'globulins')::numeric +
  (protein_composition->>'prolamins')::numeric +
  (protein_composition->>'glutelins')::numeric = 100
);

ALTER TABLE private_flours
ADD CONSTRAINT check_mechanical_properties_values
CHECK (
  (mechanical_properties->>'binding')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'stickiness')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'water_absorption')::text IN ('low', 'medium', 'high')
);
