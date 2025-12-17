/*
  # Fix private_flours and private_flour_categories tables

  1. Changes
    - Ensure private_flour_categories table exists with correct structure
    - Ensure private_flours table exists with correct structure
    - Fix column names and foreign key relationships
    - Add proper constraints and indexes

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- First, ensure private_flour_categories table exists
CREATE TABLE IF NOT EXISTS private_flour_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_private_category uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint for category names per user if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'private_flour_categories_name_user_unique'
  ) THEN
    ALTER TABLE private_flour_categories
    ADD CONSTRAINT private_flour_categories_name_user_unique 
    UNIQUE (name, user_id_private_category);
  END IF;
END $$;

-- Create indexes for private_flour_categories
CREATE INDEX IF NOT EXISTS idx_private_flour_categories_user_id 
ON private_flour_categories(user_id_private_category);

CREATE INDEX IF NOT EXISTS idx_private_flour_categories_name 
ON private_flour_categories(name);

-- Now, ensure private_flours table exists with correct structure
CREATE TABLE IF NOT EXISTS private_flours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_private_flours uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  private_flour_categories_id uuid REFERENCES private_flour_categories(id) ON DELETE SET NULL,
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
  updated_at timestamptz DEFAULT now(),
  category_id uuid REFERENCES private_flour_categories(id) ON DELETE SET NULL
);

-- Create indexes for private_flours
CREATE INDEX IF NOT EXISTS idx_private_flours_user_id 
ON private_flours(user_id_private_flours);

CREATE INDEX IF NOT EXISTS idx_private_flours_category_id 
ON private_flours(category_id);

CREATE INDEX IF NOT EXISTS idx_private_flours_private_flour_categories_id 
ON private_flours(private_flour_categories_id);

-- Create trigger for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_private_flours_updated_at'
  ) THEN
    CREATE TRIGGER update_private_flours_updated_at
    BEFORE UPDATE ON private_flours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add constraints for data validation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'check_protein_composition_sum'
  ) THEN
    ALTER TABLE private_flours
    ADD CONSTRAINT check_protein_composition_sum
    CHECK (
      (protein_composition->>'albumins')::numeric +
      (protein_composition->>'globulins')::numeric +
      (protein_composition->>'prolamins')::numeric +
      (protein_composition->>'glutelins')::numeric = 100
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'check_mechanical_properties_values'
  ) THEN
    ALTER TABLE private_flours
    ADD CONSTRAINT check_mechanical_properties_values
    CHECK (
      (mechanical_properties->>'binding')::text IN ('low', 'medium', 'high') AND
      (mechanical_properties->>'stickiness')::text IN ('low', 'medium', 'high') AND
      (mechanical_properties->>'water_absorption')::text IN ('low', 'medium', 'high')
    );
  END IF;
END $$;
