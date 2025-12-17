/*
  # Add Protein Composition to Flours

  1. Changes
    - Add protein_composition column to flours table
    - Update existing flours with protein composition data
    - Add check constraint after data is populated

  2. Properties
    - JSONB column for flexible protein composition storage
    - Four main protein types: albumins, globulins, prolamins, glutelins
    - Values represent percentage of total protein content
*/

-- Add protein_composition column without constraint first
ALTER TABLE flours
ADD COLUMN protein_composition jsonb NOT NULL DEFAULT '{
  "albumins": 25,
  "globulins": 25,
  "prolamins": 25,
  "glutelins": 25
}'::jsonb;

-- Update protein composition for existing flours
UPDATE flours
SET protein_composition = CASE
  -- Céréales
  WHEN name = 'Farine de Blé T45' THEN '{
    "albumins": 15,
    "globulins": 5,
    "prolamins": 40,
    "glutelins": 40
  }'::jsonb
  WHEN name = 'Farine de Maïs' THEN '{
    "albumins": 5,
    "globulins": 10,
    "prolamins": 55,
    "glutelins": 30
  }'::jsonb
  WHEN name = 'Farine d''Avoine' THEN '{
    "albumins": 20,
    "globulins": 15,
    "prolamins": 35,
    "glutelins": 30
  }'::jsonb
  WHEN name = 'Farine de Riz' THEN '{
    "albumins": 10,
    "globulins": 15,
    "prolamins": 35,
    "glutelins": 40
  }'::jsonb
  
  -- Protéines Animales
  WHEN name = 'Farine de Poisson LT94' THEN '{
    "albumins": 40,
    "globulins": 45,
    "prolamins": 10,
    "glutelins": 5
  }'::jsonb
  WHEN name = 'Farine de Crevette' THEN '{
    "albumins": 45,
    "globulins": 40,
    "prolamins": 10,
    "glutelins": 5
  }'::jsonb
  WHEN name = 'Farine de Krill' THEN '{
    "albumins": 50,
    "globulins": 35,
    "prolamins": 10,
    "glutelins": 5
  }'::jsonb
  
  -- Protéines Végétales
  WHEN name = 'Farine de Soja' THEN '{
    "albumins": 10,
    "globulins": 70,
    "prolamins": 10,
    "glutelins": 10
  }'::jsonb
  WHEN name = 'Farine de Pois' THEN '{
    "albumins": 15,
    "globulins": 65,
    "prolamins": 10,
    "glutelins": 10
  }'::jsonb
  WHEN name = 'Farine de Lupin' THEN '{
    "albumins": 20,
    "globulins": 60,
    "prolamins": 10,
    "glutelins": 10
  }'::jsonb
  
  -- Farines d'Insectes
  WHEN name = 'Farine de Grillon' THEN '{
    "albumins": 30,
    "globulins": 50,
    "prolamins": 15,
    "glutelins": 5
  }'::jsonb
  WHEN name = 'Farine de Ver de Farine' THEN '{
    "albumins": 35,
    "globulins": 45,
    "prolamins": 15,
    "glutelins": 5
  }'::jsonb
  
  -- Default values for other flours (ensure 100% total)
  ELSE protein_composition
END;

-- Now add the check constraint after data is properly set
ALTER TABLE flours
ADD CONSTRAINT check_protein_composition_sum
CHECK (
  (protein_composition->>'albumins')::numeric +
  (protein_composition->>'globulins')::numeric +
  (protein_composition->>'prolamins')::numeric +
  (protein_composition->>'glutelins')::numeric = 100
);
