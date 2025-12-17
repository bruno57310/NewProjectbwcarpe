-- Create tables in separate transactions to ensure they exist before populating
BEGIN;

-- Create contributionanti_nutrients table if it doesn't exist
CREATE TABLE IF NOT EXISTS contributionanti_nutrients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flour_id uuid REFERENCES flours_template(id) ON DELETE CASCADE,
  lectins numeric NOT NULL DEFAULT 0,
  tannins numeric NOT NULL DEFAULT 0,
  saponins numeric NOT NULL DEFAULT 0,
  phytic_acid numeric NOT NULL DEFAULT 0,
  trypsin_inhibitors numeric NOT NULL DEFAULT 0,
  anti_nutrients_total_contri numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contributionanti_nutrients_flour_id_key UNIQUE (flour_id)
);

-- Enable RLS if not already enabled
ALTER TABLE contributionanti_nutrients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin can manage all contribution data" ON contributionanti_nutrients;
DROP POLICY IF EXISTS "Paid subscribers can view contribution data" ON contributionanti_nutrients;

-- Create RLS policies
CREATE POLICY "Admin can manage all contribution data"
  ON contributionanti_nutrients
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Paid subscribers can view contribution data"
  ON contributionanti_nutrients
  FOR SELECT
  TO authenticated
  USING (has_paid_subscription(auth.uid()));
  
-- Create updated_at trigger if it doesn't exist
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
END $$;
  
-- Create index if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_contributionanti_nutrients_flour_id'
  ) THEN
    CREATE INDEX idx_contributionanti_nutrients_flour_id 
    ON contributionanti_nutrients(flour_id);
  END IF;
END $$;

COMMIT;

-- Create private contributions table in a separate transaction
BEGIN;

-- Create contributionanti_nutrients_private table if it doesn't exist
CREATE TABLE IF NOT EXISTS contributionanti_nutrients_private (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flour_id uuid REFERENCES private_flours(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Use user_id instead of user_id_private_flours
  lectins numeric NOT NULL DEFAULT 0,
  tannins numeric NOT NULL DEFAULT 0,
  saponins numeric NOT NULL DEFAULT 0,
  phytic_acid numeric NOT NULL DEFAULT 0,
  trypsin_inhibitors numeric NOT NULL DEFAULT 0,
  anti_nutrients_total_contri numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contributionanti_nutrients_private_flour_id_key UNIQUE (flour_id)
);

-- Enable RLS if not already enabled
ALTER TABLE contributionanti_nutrients_private ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin can manage all private contribution data" ON contributionanti_nutrients_private;
DROP POLICY IF EXISTS "Users can view their own private contribution data" ON contributionanti_nutrients_private;
DROP POLICY IF EXISTS "Users can create their own private contribution data" ON contributionanti_nutrients_private;
DROP POLICY IF EXISTS "Users can update their own private contribution data" ON contributionanti_nutrients_private;
DROP POLICY IF EXISTS "Users can delete their own private contribution data" ON contributionanti_nutrients_private;

-- Create RLS policies
CREATE POLICY "Admin can manage all private contribution data"
  ON contributionanti_nutrients_private
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Users can view their own private contribution data"
  ON contributionanti_nutrients_private
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Users can create their own private contribution data"
  ON contributionanti_nutrients_private
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    has_enterprise_subscription(auth.uid())
  );

CREATE POLICY "Users can update their own private contribution data"
  ON contributionanti_nutrients_private
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

CREATE POLICY "Users can delete their own private contribution data"
  ON contributionanti_nutrients_private
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    has_enterprise_subscription(auth.uid())
  );
  
-- Create updated_at trigger if it doesn't exist
DO $$ 
BEGIN
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
    WHERE indexname = 'idx_contributionanti_nutrients_private_flour_id'
  ) THEN
    CREATE INDEX idx_contributionanti_nutrients_private_flour_id 
    ON contributionanti_nutrients_private(flour_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_contributionanti_nutrients_private_user_id'
  ) THEN
    CREATE INDEX idx_contributionanti_nutrients_private_user_id 
    ON contributionanti_nutrients_private(user_id);
  END IF;
END $$;

COMMIT;

-- Populate the tables in a separate transaction after they're created
BEGIN;

-- Delete existing data to avoid duplicates
DELETE FROM contributionanti_nutrients;

-- Insert data for flours_template
INSERT INTO contributionanti_nutrients (
  flour_id,
  lectins,
  tannins,
  saponins,
  phytic_acid,
  trypsin_inhibitors,
  anti_nutrients_total_contri
)
SELECT 
  id,
  CASE (anti_nutrients->>'lectins')
    WHEN 'high' THEN 0.75
    WHEN 'medium' THEN 0.50
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END AS lectins,
  CASE (anti_nutrients->>'tannins')
    WHEN 'high' THEN 0.80
    WHEN 'medium' THEN 0.45
    WHEN 'low' THEN 0.20
    ELSE 0.10
  END AS tannins,
  CASE (anti_nutrients->>'saponins')
    WHEN 'high' THEN 0.70
    WHEN 'medium' THEN 0.40
    WHEN 'low' THEN 0.15
    ELSE 0.10
  END AS saponins,
  CASE (anti_nutrients->>'phytic_acid')
    WHEN 'high' THEN 0.85
    WHEN 'medium' THEN 0.55
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END AS phytic_acid,
  CASE (anti_nutrients->>'trypsin_inhibitors')
    WHEN 'high' THEN 0.90
    WHEN 'medium' THEN 0.60
    WHEN 'low' THEN 0.30
    ELSE 0.10
  END AS trypsin_inhibitors,
  CASE (anti_nutrients->>'lectins')
    WHEN 'high' THEN 0.75
    WHEN 'medium' THEN 0.50
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'tannins')
    WHEN 'high' THEN 0.80
    WHEN 'medium' THEN 0.45
    WHEN 'low' THEN 0.20
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'saponins')
    WHEN 'high' THEN 0.70
    WHEN 'medium' THEN 0.40
    WHEN 'low' THEN 0.15
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'phytic_acid')
    WHEN 'high' THEN 0.85
    WHEN 'medium' THEN 0.55
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'trypsin_inhibitors')
    WHEN 'high' THEN 0.90
    WHEN 'medium' THEN 0.60
    WHEN 'low' THEN 0.30
    ELSE 0.10
  END AS anti_nutrients_total_contri
FROM flours_template;

-- Delete existing data to avoid duplicates
DELETE FROM contributionanti_nutrients_private;

-- Insert data for private_flours
INSERT INTO contributionanti_nutrients_private (
  flour_id,
  user_id,  -- Changed from user_id_private_flours to user_id
  lectins,
  tannins,
  saponins,
  phytic_acid,
  trypsin_inhibitors,
  anti_nutrients_total_contri
)
SELECT 
  id,
  user_id_private_flours,  -- This is the source column from private_flours
  CASE (anti_nutrients->>'lectins')
    WHEN 'high' THEN 0.75
    WHEN 'medium' THEN 0.50
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END AS lectins,
  CASE (anti_nutrients->>'tannins')
    WHEN 'high' THEN 0.80
    WHEN 'medium' THEN 0.45
    WHEN 'low' THEN 0.20
    ELSE 0.10
  END AS tannins,
  CASE (anti_nutrients->>'saponins')
    WHEN 'high' THEN 0.70
    WHEN 'medium' THEN 0.40
    WHEN 'low' THEN 0.15
    ELSE 0.10
  END AS saponins,
  CASE (anti_nutrients->>'phytic_acid')
    WHEN 'high' THEN 0.85
    WHEN 'medium' THEN 0.55
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END AS phytic_acid,
  CASE (anti_nutrients->>'trypsin_inhibitors')
    WHEN 'high' THEN 0.90
    WHEN 'medium' THEN 0.60
    WHEN 'low' THEN 0.30
    ELSE 0.10
  END AS trypsin_inhibitors,
  CASE (anti_nutrients->>'lectins')
    WHEN 'high' THEN 0.75
    WHEN 'medium' THEN 0.50
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'tannins')
    WHEN 'high' THEN 0.80
    WHEN 'medium' THEN 0.45
    WHEN 'low' THEN 0.20
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'saponins')
    WHEN 'high' THEN 0.70
    WHEN 'medium' THEN 0.40
    WHEN 'low' THEN 0.15
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'phytic_acid')
    WHEN 'high' THEN 0.85
    WHEN 'medium' THEN 0.55
    WHEN 'low' THEN 0.25
    ELSE 0.10
  END +
  CASE (anti_nutrients->>'trypsin_inhibitors')
    WHEN 'high' THEN 0.90
    WHEN 'medium' THEN 0.60
    WHEN 'low' THEN 0.30
    ELSE 0.10
  END AS anti_nutrients_total_contri
FROM private_flours
WHERE user_id_private_flours IS NOT NULL;

COMMIT;
