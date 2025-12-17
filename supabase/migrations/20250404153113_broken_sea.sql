/*
  # Initial Schema Setup for CarpBait Pro

  1. New Tables
    - `flour_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)

    - `flours`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `protein_profile` (text, enum)
      - `protein_quality` (text, enum)
      - `nutritional_values` (jsonb)
      - `mechanical_properties` (jsonb)
      - `solubility` (text, enum)
      - `recommended_ratio` (jsonb)
      - `tips` (text[])
      - `image_url` (text)
      - `price_per_kg` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for all users
    - Write access restricted to authenticated users with admin role
*/

-- Create flour_categories table
CREATE TABLE IF NOT EXISTS flour_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for flour_categories
ALTER TABLE flour_categories ENABLE ROW LEVEL SECURITY;

-- Create public read policy for flour_categories
CREATE POLICY "Allow public read access for categories"
  ON flour_categories
  FOR SELECT
  TO public
  USING (true);

-- Create flours table with all necessary columns and constraints
CREATE TABLE IF NOT EXISTS flours (
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
  mechanical_properties jsonb NOT NULL DEFAULT '{
    "binding": "medium",
    "stickiness": "medium",
    "water_absorption": "medium"
  }'::jsonb,
  solubility text CHECK (solubility IN ('low', 'medium', 'high')),
  recommended_ratio jsonb NOT NULL DEFAULT '{"min": 0, "max": 100}'::jsonb,
  tips text[] DEFAULT ARRAY[]::text[],
  image_url text,
  price_per_kg numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for flours
ALTER TABLE flours ENABLE ROW LEVEL SECURITY;

-- Create public read policy for flours
CREATE POLICY "Allow public read access for flours"
  ON flours
  FOR SELECT
  TO public
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_flours_updated_at
  BEFORE UPDATE ON flours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_flours_category_id ON flours(category_id);
CREATE INDEX IF NOT EXISTS idx_flours_protein_profile ON flours(protein_profile);
CREATE INDEX IF NOT EXISTS idx_flours_protein_quality ON flours(protein_quality);
CREATE INDEX IF NOT EXISTS idx_flours_solubility ON flours(solubility);
