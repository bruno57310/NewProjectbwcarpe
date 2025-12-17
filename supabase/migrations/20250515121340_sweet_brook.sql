/*
  # Add Anti-Nutrient Contribution Tables

  1. New Tables
    - `contributionanti_nutrients`: Store anti-nutrient contribution values for public flours
    - `contributionanti_nutrients_private`: Store anti-nutrient contribution values for private flours
    
  2. Security
    - Enable RLS
    - Admin can manage all contributions
    - Users can view contributions based on subscription level
*/

-- Check if tables already exist before creating them
DO $$ 
BEGIN
  -- Create contributionanti_nutrients table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributionanti_nutrients') THEN
    CREATE TABLE contributionanti_nutrients (
      flour_id uuid PRIMARY KEY REFERENCES flours_template(id) ON DELETE CASCADE,
      flour_name text NOT NULL,
      anti_nutrients_contri jsonb DEFAULT '{
        "lectins": 0,
        "tannins": 0,
        "saponins": 0,
        "phytic_acid": 0,
        "trypsin_inhibitors": 0
      }'::jsonb,
      anti_nutrients_total_contri numeric DEFAULT 0,
      contribution_anti_nutrientsyall jsonb
    );
  END IF;

  -- Create contributionanti_nutrients_private table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributionanti_nutrients_private') THEN
    CREATE TABLE contributionanti_nutrients_private (
      flour_id uuid PRIMARY KEY REFERENCES private_flours(id) ON DELETE CASCADE,
      flour_name text NOT NULL,
      anti_nutrients_contri jsonb DEFAULT '{
        "lectins": 0,
        "tannins": 0,
        "saponins": 0,
        "phytic_acid": 0,
        "trypsin_inhibitors": 0
      }'::jsonb,
      anti_nutrients_total_contri numeric DEFAULT 0,
      contribution_anti_nutrientsyall jsonb
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  -- Enable RLS for contributionanti_nutrients
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'contributionanti_nutrients' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE contributionanti_nutrients ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Enable RLS for contributionanti_nutrients_private
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'contributionanti_nutrients_private' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE contributionanti_nutrients_private ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop policies for contributionanti_nutrients
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionanti_nutrients' 
    AND policyname = 'Admin can manage all contributions'
  ) THEN
    DROP POLICY "Admin can manage all contributions" ON contributionanti_nutrients;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionanti_nutrients' 
    AND policyname = 'Users can view contributions'
  ) THEN
    DROP POLICY "Users can view contributions" ON contributionanti_nutrients;
  END IF;
  
  -- Drop policies for contributionanti_nutrients_private
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionanti_nutrients_private' 
    AND policyname = 'Admin can manage all private contributions'
  ) THEN
    DROP POLICY "Admin can manage all private contributions" ON contributionanti_nutrients_private;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionanti_nutrients_private' 
    AND policyname = 'Users can view their own private contributions'
  ) THEN
    DROP POLICY "Users can view their own private contributions" ON contributionanti_nutrients_private;
  END IF;
END $$;

-- Create RLS policies for contributionanti_nutrients
CREATE POLICY "Admin can manage all contributions"
  ON contributionanti_nutrients
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Users can view contributions"
  ON contributionanti_nutrients
  FOR SELECT
  TO authenticated
  USING (has_paid_subscription(auth.uid()));

-- Create RLS policies for contributionanti_nutrients_private
CREATE POLICY "Admin can manage all private contributions"
  ON contributionanti_nutrients_private
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Users can view their own private contributions"
  ON contributionanti_nutrients_private
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM private_flours
      WHERE private_flours.id = contributionanti_nutrients_private.flour_id
      AND private_flours.user_id_private_flours = auth.uid()
      AND has_enterprise_subscription(auth.uid())
    )
  );

-- Create updated_at triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_contributionanti_nutrients_updated_at'
  ) THEN
    CREATE TRIGGER update_contributionanti_nutrients_updated_at
      BEFORE UPDATE ON contributionanti_nutrients
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_contributionanti_nutrients_private_updated_at'
  ) THEN
    CREATE TRIGGER update_contributionanti_nutrients_private_updated_at
      BEFORE UPDATE ON contributionanti_nutrients_private
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_contributionanti_nutrients_flour_id'
  ) THEN
    CREATE INDEX idx_contributionanti_nutrients_flour_id ON contributionanti_nutrients(flour_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_contributionanti_nutrients_private_flour_id'
  ) THEN
    CREATE INDEX idx_contributionanti_nutrients_private_flour_id ON contributionanti_nutrients_private(flour_id);
  END IF;
END $$;
