/*
  # Add Anti-Nutrient Contribution Tables

  1. New Tables
    - `contributionanti_nutrients`: Store anti-nutrient contribution values for public flours
    - `contributionanti_nutrients_private`: Store anti-nutrient contribution values for private flours
    
  2. Security
    - Enable RLS
    - Admin can manage all contributions
    - Users can view contributions based on their subscription level
*/

-- Create contributionanti_nutrients table
CREATE TABLE IF NOT EXISTS contributionanti_nutrients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flour_id uuid REFERENCES flours(id) ON DELETE CASCADE,
  contribution_anti_nutrientsyall jsonb DEFAULT '{
    "lectins": 0,
    "tannins": 0,
    "saponins": 0,
    "phytic_acid": 0,
    "trypsin_inhibitors": 0
  }'::jsonb,
  lectins numeric DEFAULT 0,
  tannins numeric DEFAULT 0,
  saponins numeric DEFAULT 0,
  phytic_acid numeric DEFAULT 0,
  trypsin_inhibitors numeric DEFAULT 0,
  anti_nutrients_total_contri numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contributionanti_nutrients_private table
CREATE TABLE IF NOT EXISTS contributionanti_nutrients_private (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flour_id uuid REFERENCES private_flours(id) ON DELETE CASCADE,
  contribution_anti_nutrientsyall jsonb DEFAULT '{
    "lectins": 0,
    "tannins": 0,
    "saponins": 0,
    "phytic_acid": 0,
    "trypsin_inhibitors": 0
  }'::jsonb,
  lectins numeric DEFAULT 0,
  tannins numeric DEFAULT 0,
  saponins numeric DEFAULT 0,
  phytic_acid numeric DEFAULT 0,
  trypsin_inhibitors numeric DEFAULT 0,
  anti_nutrients_total_contri numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contributionanti_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributionanti_nutrients_private ENABLE ROW LEVEL SECURITY;

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

-- Create updated_at triggers (only if they don't exist)
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

-- Create indexes (only if they don't exist)
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

-- Insert sample data for public flours
INSERT INTO contributionanti_nutrients (
  flour_id,
  contribution_anti_nutrientsyall,
  lectins,
  tannins,
  saponins,
  phytic_acid,
  trypsin_inhibitors,
  anti_nutrients_total_contri
)
SELECT 
  id,
  jsonb_build_object(
    'lectins', CASE 
      WHEN anti_nutrients->>'lectins' = 'low' THEN 0.5
      WHEN anti_nutrients->>'lectins' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'lectins' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'tannins', CASE 
      WHEN anti_nutrients->>'tannins' = 'low' THEN 0.5
      WHEN anti_nutrients->>'tannins' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'tannins' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'saponins', CASE 
      WHEN anti_nutrients->>'saponins' = 'low' THEN 0.5
      WHEN anti_nutrients->>'saponins' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'saponins' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'phytic_acid', CASE 
      WHEN anti_nutrients->>'phytic_acid' = 'low' THEN 0.5
      WHEN anti_nutrients->>'phytic_acid' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'phytic_acid' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'trypsin_inhibitors', CASE 
      WHEN anti_nutrients->>'trypsin_inhibitors' = 'low' THEN 0.5
      WHEN anti_nutrients->>'trypsin_inhibitors' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'trypsin_inhibitors' = 'high' THEN 2.5
      ELSE 0.5
    END
  ),
  CASE 
    WHEN anti_nutrients->>'lectins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'lectins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'lectins' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'tannins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'tannins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'tannins' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'saponins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'saponins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'saponins' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'phytic_acid' = 'low' THEN 0.5
    WHEN anti_nutrients->>'phytic_acid' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'phytic_acid' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'low' THEN 0.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'high' THEN 2.5
    ELSE 0.5
  END,
  (CASE 
    WHEN anti_nutrients->>'lectins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'lectins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'lectins' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'tannins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'tannins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'tannins' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'saponins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'saponins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'saponins' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'phytic_acid' = 'low' THEN 0.5
    WHEN anti_nutrients->>'phytic_acid' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'phytic_acid' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'low' THEN 0.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'high' THEN 2.5
    ELSE 0.5
  END)
FROM flours
ON CONFLICT (flour_id) DO NOTHING;

-- Insert sample data for enterprise flours
INSERT INTO contributionanti_nutrients (
  flour_id,
  contribution_anti_nutrientsyall,
  lectins,
  tannins,
  saponins,
  phytic_acid,
  trypsin_inhibitors,
  anti_nutrients_total_contri
)
SELECT 
  id,
  jsonb_build_object(
    'lectins', CASE 
      WHEN anti_nutrients->>'lectins' = 'low' THEN 0.5
      WHEN anti_nutrients->>'lectins' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'lectins' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'tannins', CASE 
      WHEN anti_nutrients->>'tannins' = 'low' THEN 0.5
      WHEN anti_nutrients->>'tannins' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'tannins' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'saponins', CASE 
      WHEN anti_nutrients->>'saponins' = 'low' THEN 0.5
      WHEN anti_nutrients->>'saponins' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'saponins' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'phytic_acid', CASE 
      WHEN anti_nutrients->>'phytic_acid' = 'low' THEN 0.5
      WHEN anti_nutrients->>'phytic_acid' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'phytic_acid' = 'high' THEN 2.5
      ELSE 0.5
    END,
    'trypsin_inhibitors', CASE 
      WHEN anti_nutrients->>'trypsin_inhibitors' = 'low' THEN 0.5
      WHEN anti_nutrients->>'trypsin_inhibitors' = 'medium' THEN 1.5
      WHEN anti_nutrients->>'trypsin_inhibitors' = 'high' THEN 2.5
      ELSE 0.5
    END
  ),
  CASE 
    WHEN anti_nutrients->>'lectins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'lectins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'lectins' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'tannins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'tannins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'tannins' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'saponins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'saponins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'saponins' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'phytic_acid' = 'low' THEN 0.5
    WHEN anti_nutrients->>'phytic_acid' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'phytic_acid' = 'high' THEN 2.5
    ELSE 0.5
  END,
  CASE 
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'low' THEN 0.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'high' THEN 2.5
    ELSE 0.5
  END,
  (CASE 
    WHEN anti_nutrients->>'lectins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'lectins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'lectins' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'tannins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'tannins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'tannins' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'saponins' = 'low' THEN 0.5
    WHEN anti_nutrients->>'saponins' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'saponins' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'phytic_acid' = 'low' THEN 0.5
    WHEN anti_nutrients->>'phytic_acid' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'phytic_acid' = 'high' THEN 2.5
    ELSE 0.5
  END) +
  (CASE 
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'low' THEN 0.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'medium' THEN 1.5
    WHEN anti_nutrients->>'trypsin_inhibitors' = 'high' THEN 2.5
    ELSE 0.5
  END)
FROM flours_template
ON CONFLICT (flour_id) DO NOTHING;
