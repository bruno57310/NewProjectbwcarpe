-- Drop existing tables if they exist
DROP TABLE IF EXISTS private_flours CASCADE;
DROP TABLE IF EXISTS private_flour_categories CASCADE;

-- Create private_flour_categories table
CREATE TABLE private_flour_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for private_flour_categories
CREATE INDEX idx_private_flour_categories_user_id ON private_flour_categories(user_id);
CREATE INDEX idx_private_flour_categories_name ON private_flour_categories(name);

-- Add unique constraint for category names per user
ALTER TABLE private_flour_categories
ADD CONSTRAINT private_flour_categories_name_user_unique UNIQUE (name, user_id);

-- Create private_flours table
CREATE TABLE private_flours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES private_flour_categories(id) ON DELETE SET NULL,
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

-- Create indexes for private_flours
CREATE INDEX idx_private_flours_user_id ON private_flours(user_id);
CREATE INDEX idx_private_flours_category_id ON private_flours(category_id);
CREATE INDEX idx_private_flours_protein_profile ON private_flours(protein_profile);
CREATE INDEX idx_private_flours_protein_quality ON private_flours(protein_quality);
CREATE INDEX idx_private_flours_solubility ON private_flours(solubility);

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

-- Create trigger for updated_at
CREATE TRIGGER update_private_flours_updated_at
  BEFORE UPDATE ON private_flours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE private_flour_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_flours ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for private_flour_categories
CREATE POLICY "Users can create private categories"
ON private_flour_categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private categories"
ON private_flour_categories
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private categories"
ON private_flour_categories
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private categories"
ON private_flour_categories
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

-- Create RLS policies for private_flours
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);
