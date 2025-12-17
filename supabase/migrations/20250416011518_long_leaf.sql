/*
  # Fix private_flours table schema

  1. Changes
    - Check if private_flours table exists and create it if not
    - Rename user_id to user_id_private_flours if needed
    - Add category_id column if it doesn't exist
    - Set up proper foreign key relationship
    - Create necessary indexes

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- First, check if private_flours table exists and create it if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'private_flours'
  ) THEN
    CREATE TABLE private_flours (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id_private_flours uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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
  END IF;
END $$;

-- Add category_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'private_flours' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE private_flours 
    ADD COLUMN category_id uuid;
  END IF;
END $$;

-- Rename user_id to user_id_private_flours if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'private_flours' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'private_flours' 
    AND column_name = 'user_id_private_flours'
  ) THEN
    ALTER TABLE private_flours 
    RENAME COLUMN user_id TO user_id_private_flours;
  END IF;
END $$;

-- Drop existing foreign key if it exists
ALTER TABLE private_flours 
DROP CONSTRAINT IF EXISTS private_flours_category_id_fkey;

-- Add the foreign key constraint with proper cascade behavior
ALTER TABLE private_flours
ADD CONSTRAINT private_flours_category_id_fkey
FOREIGN KEY (category_id) 
REFERENCES private_flour_categories(id) 
ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_private_flours_category_id 
ON private_flours(category_id);

CREATE INDEX IF NOT EXISTS idx_private_flours_user_id 
ON private_flours(user_id_private_flours);

-- Create indexes for better filtering
CREATE INDEX IF NOT EXISTS idx_private_flours_protein_profile 
ON private_flours(protein_profile);

CREATE INDEX IF NOT EXISTS idx_private_flours_protein_quality 
ON private_flours(protein_quality);

CREATE INDEX IF NOT EXISTS idx_private_flours_solubility 
ON private_flours(solubility);

-- Add constraints for data validation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'private_flours_protein_profile_check'
  ) THEN
    ALTER TABLE private_flours
    ADD CONSTRAINT private_flours_protein_profile_check
    CHECK (protein_profile IN ('simple', 'complex'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'private_flours_protein_quality_check'
  ) THEN
    ALTER TABLE private_flours
    ADD CONSTRAINT private_flours_protein_quality_check
    CHECK (protein_quality IN ('complete', 'incomplete'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'private_flours_solubility_check'
  ) THEN
    ALTER TABLE private_flours
    ADD CONSTRAINT private_flours_solubility_check
    CHECK (solubility IN ('low', 'medium', 'high'));
  END IF;
END $$;
