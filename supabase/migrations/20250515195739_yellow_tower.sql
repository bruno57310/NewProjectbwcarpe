/*
  # Add Enzyme Contribution Tables and Functions

  1. New Tables
    - `contributionenzymes`: Store enzyme contribution values for public flours
    - `contributionenzymes_private`: Store enzyme contribution values for private flours
    
  2. Security
    - Enable RLS
    - Admin can manage all contributions
    - Users can view contributions based on subscription level
*/

-- Check if tables already exist before creating them
DO $$ 
BEGIN
  -- Create contributionenzymes table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributionenzymes') THEN
    CREATE TABLE contributionenzymes (
      flour_id uuid PRIMARY KEY REFERENCES flours_template(id) ON DELETE CASCADE,
      flour_name text NOT NULL,
      enzymes_contri jsonb NOT NULL,
      enzymes_total_contri numeric,
      contribution_enzymesyall jsonb
    );
    
    -- Enable RLS
    ALTER TABLE contributionenzymes ENABLE ROW LEVEL SECURITY;
    
    -- Create indexes
    CREATE INDEX idx_contributionenzymes_flour_id ON contributionenzymes(flour_id);
  END IF;

  -- Create contributionenzymes_private table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributionenzymes_private') THEN
    CREATE TABLE contributionenzymes_private (
      flour_id uuid PRIMARY KEY REFERENCES private_flours(id) ON DELETE CASCADE,
      flour_name text NOT NULL,
      enzymes_contri jsonb NOT NULL,
      enzymes_total_contri numeric,
      contribution_enzymesyall jsonb
    );
    
    -- Enable RLS
    ALTER TABLE contributionenzymes_private ENABLE ROW LEVEL SECURITY;
    
    -- Create indexes
    CREATE INDEX idx_contributionenzymes_private_flour_id ON contributionenzymes_private(flour_id);
  END IF;
END $$;

-- Create RLS policies for contributionenzymes if they don't exist
DO $$
BEGIN
  -- Check if policies exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionenzymes' 
    AND policyname = 'Admin can manage all contributions'
  ) THEN
    CREATE POLICY "Admin can manage all contributions"
      ON contributionenzymes
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionenzymes' 
    AND policyname = 'Users can view contributions'
  ) THEN
    CREATE POLICY "Users can view contributions"
      ON contributionenzymes
      FOR SELECT
      TO authenticated
      USING (has_paid_subscription(auth.uid()));
  END IF;
END $$;

-- Create RLS policies for contributionenzymes_private if they don't exist
DO $$
BEGIN
  -- Check if policies exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionenzymes_private' 
    AND policyname = 'Admin can manage all private contributions'
  ) THEN
    CREATE POLICY "Admin can manage all private contributions"
      ON contributionenzymes_private
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contributionenzymes_private' 
    AND policyname = 'Users can view their own private contributions'
  ) THEN
    CREATE POLICY "Users can view their own private contributions"
      ON contributionenzymes_private
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM private_flours
          WHERE private_flours.id = contributionenzymes_private.flour_id
          AND private_flours.user_id_private_flours = auth.uid()
          AND has_enterprise_subscription(auth.uid())
        )
      );
  END IF;
END $$;

-- Create updated_at triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_contributionenzymes_updated_at'
  ) THEN
    CREATE TRIGGER update_contributionenzymes_updated_at
      BEFORE UPDATE ON contributionenzymes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_contributionenzymes_private_updated_at'
  ) THEN
    CREATE TRIGGER update_contributionenzymes_private_updated_at
      BEFORE UPDATE ON contributionenzymes_private
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Drop existing functions and triggers to avoid conflicts
DROP TRIGGER IF EXISTS trg_sync_contributionenzymes ON flours_template;
DROP TRIGGER IF EXISTS trg_sync_contributionenzymes_private ON private_flours;
DROP FUNCTION IF EXISTS sync_contributionenzymes();
DROP FUNCTION IF EXISTS sync_contributionenzymes_private();

-- Create function to sync enzymatic contributions for public flours
CREATE OR REPLACE FUNCTION sync_contributionenzymes()
RETURNS TRIGGER AS $$
DECLARE
  total_enzymes numeric;
  enzymes_json jsonb;
  enzyme_values jsonb;
BEGIN
  -- Calculate total enzymes
  total_enzymes := (NEW.enzymatic_composition->>'amylases')::numeric + 
                  (NEW.enzymatic_composition->>'proteases')::numeric + 
                  (NEW.enzymatic_composition->>'lipases')::numeric + 
                  (NEW.enzymatic_composition->>'phytases')::numeric;
  
  -- Calculate normalized values (divide by total to get values between 0 and 1)
  IF total_enzymes > 0 THEN
    enzyme_values := jsonb_build_object(
      'amylases', ((NEW.enzymatic_composition->>'amylases')::numeric / total_enzymes) * 0.3,
      'proteases', ((NEW.enzymatic_composition->>'proteases')::numeric / total_enzymes) * 0.3,
      'lipases', ((NEW.enzymatic_composition->>'lipases')::numeric / total_enzymes) * 0.3,
      'phytases', ((NEW.enzymatic_composition->>'phytases')::numeric / total_enzymes) * 0.3
    );
  ELSE
    enzyme_values := jsonb_build_object(
      'amylases', 0,
      'proteases', 0,
      'lipases', 0,
      'phytases', 0
    );
  END IF;
  
  -- Insert or update the contribution record
  INSERT INTO contributionenzymes (
    flour_id,
    flour_name,
    enzymes_contri,
    enzymes_total_contri,
    contribution_enzymesyall
  ) VALUES (
    NEW.id,
    NEW.name,
    NEW.enzymatic_composition,
    total_enzymes,
    enzyme_values
  )
  ON CONFLICT (flour_id) 
  DO UPDATE SET
    flour_name = NEW.name,
    enzymes_contri = NEW.enzymatic_composition,
    enzymes_total_contri = total_enzymes,
    contribution_enzymesyall = enzyme_values;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync enzymatic contributions for private flours
CREATE OR REPLACE FUNCTION sync_contributionenzymes_private()
RETURNS TRIGGER AS $$
DECLARE
  total_enzymes numeric;
  enzymes_json jsonb;
  enzyme_values jsonb;
BEGIN
  -- Calculate total enzymes
  total_enzymes := (NEW.enzymatic_composition->>'amylases')::numeric + 
                  (NEW.enzymatic_composition->>'proteases')::numeric + 
                  (NEW.enzymatic_composition->>'lipases')::numeric + 
                  (NEW.enzymatic_composition->>'phytases')::numeric;
  
  -- Calculate normalized values (divide by total to get values between 0 and 1)
  IF total_enzymes > 0 THEN
    enzyme_values := jsonb_build_object(
      'amylases', ((NEW.enzymatic_composition->>'amylases')::numeric / total_enzymes) * 0.3,
      'proteases', ((NEW.enzymatic_composition->>'proteases')::numeric / total_enzymes) * 0.3,
      'lipases', ((NEW.enzymatic_composition->>'lipases')::numeric / total_enzymes) * 0.3,
      'phytases', ((NEW.enzymatic_composition->>'phytases')::numeric / total_enzymes) * 0.3
    );
  ELSE
    enzyme_values := jsonb_build_object(
      'amylases', 0,
      'proteases', 0,
      'lipases', 0,
      'phytases', 0
    );
  END IF;
  
  -- Insert or update the contribution record
  INSERT INTO contributionenzymes_private (
    flour_id,
    flour_name,
    enzymes_contri,
    enzymes_total_contri,
    contribution_enzymesyall
  ) VALUES (
    NEW.id,
    NEW.name,
    NEW.enzymatic_composition,
    total_enzymes,
    enzyme_values
  )
  ON CONFLICT (flour_id) 
  DO UPDATE SET
    flour_name = NEW.name,
    enzymes_contri = NEW.enzymatic_composition,
    enzymes_total_contri = total_enzymes,
    contribution_enzymesyall = enzyme_values;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to sync data when flours are updated
CREATE TRIGGER trg_sync_contributionenzymes
  AFTER INSERT OR UPDATE ON flours_template
  FOR EACH ROW
  EXECUTE FUNCTION sync_contributionenzymes();

CREATE TRIGGER trg_sync_contributionenzymes_private
  AFTER INSERT OR UPDATE ON private_flours
  FOR EACH ROW
  EXECUTE FUNCTION sync_contributionenzymes_private();

-- Populate contributionenzymes table with initial data
INSERT INTO contributionenzymes (
  flour_id,
  flour_name,
  enzymes_contri,
  enzymes_total_contri,
  contribution_enzymesyall
)
SELECT 
  id,
  name,
  enzymatic_composition,
  (enzymatic_composition->>'amylases')::numeric + 
  (enzymatic_composition->>'proteases')::numeric + 
  (enzymatic_composition->>'lipases')::numeric + 
  (enzymatic_composition->>'phytases')::numeric as total_enzymes,
  CASE 
    WHEN (enzymatic_composition->>'amylases')::numeric + 
         (enzymatic_composition->>'proteases')::numeric + 
         (enzymatic_composition->>'lipases')::numeric + 
         (enzymatic_composition->>'phytases')::numeric > 0 
    THEN 
      jsonb_build_object(
        'amylases', ((enzymatic_composition->>'amylases')::numeric / 
                    ((enzymatic_composition->>'amylases')::numeric + 
                     (enzymatic_composition->>'proteases')::numeric + 
                     (enzymatic_composition->>'lipases')::numeric + 
                     (enzymatic_composition->>'phytases')::numeric)) * 0.3,
        'proteases', ((enzymatic_composition->>'proteases')::numeric / 
                     ((enzymatic_composition->>'amylases')::numeric + 
                      (enzymatic_composition->>'proteases')::numeric + 
                      (enzymatic_composition->>'lipases')::numeric + 
                      (enzymatic_composition->>'phytases')::numeric)) * 0.3,
        'lipases', ((enzymatic_composition->>'lipases')::numeric / 
                   ((enzymatic_composition->>'amylases')::numeric + 
                    (enzymatic_composition->>'proteases')::numeric + 
                    (enzymatic_composition->>'lipases')::numeric + 
                    (enzymatic_composition->>'phytases')::numeric)) * 0.3,
        'phytases', ((enzymatic_composition->>'phytases')::numeric / 
                    ((enzymatic_composition->>'amylases')::numeric + 
                     (enzymatic_composition->>'proteases')::numeric + 
                     (enzymatic_composition->>'lipases')::numeric + 
                     (enzymatic_composition->>'phytases')::numeric)) * 0.3
      )
    ELSE 
      jsonb_build_object(
        'amylases', 0,
        'proteases', 0,
        'lipases', 0,
        'phytases', 0
      )
  END as contribution_enzymesyall
FROM flours_template
WHERE NOT EXISTS (
  SELECT 1 FROM contributionenzymes 
  WHERE contributionenzymes.flour_id = flours_template.id
)
ON CONFLICT (flour_id) DO NOTHING;

-- Populate contributionenzymes_private table with initial data
INSERT INTO contributionenzymes_private (
  flour_id,
  flour_name,
  enzymes_contri,
  enzymes_total_contri,
  contribution_enzymesyall
)
SELECT 
  id,
  name,
  enzymatic_composition,
  (enzymatic_composition->>'amylases')::numeric + 
  (enzymatic_composition->>'proteases')::numeric + 
  (enzymatic_composition->>'lipases')::numeric + 
  (enzymatic_composition->>'phytases')::numeric as total_enzymes,
  CASE 
    WHEN (enzymatic_composition->>'amylases')::numeric + 
         (enzymatic_composition->>'proteases')::numeric + 
         (enzymatic_composition->>'lipases')::numeric + 
         (enzymatic_composition->>'phytases')::numeric > 0 
    THEN 
      jsonb_build_object(
        'amylases', ((enzymatic_composition->>'amylases')::numeric / 
                    ((enzymatic_composition->>'amylases')::numeric + 
                     (enzymatic_composition->>'proteases')::numeric + 
                     (enzymatic_composition->>'lipases')::numeric + 
                     (enzymatic_composition->>'phytases')::numeric)) * 0.3,
        'proteases', ((enzymatic_composition->>'proteases')::numeric / 
                     ((enzymatic_composition->>'amylases')::numeric + 
                      (enzymatic_composition->>'proteases')::numeric + 
                      (enzymatic_composition->>'lipases')::numeric + 
                      (enzymatic_composition->>'phytases')::numeric)) * 0.3,
        'lipases', ((enzymatic_composition->>'lipases')::numeric / 
                   ((enzymatic_composition->>'amylases')::numeric + 
                    (enzymatic_composition->>'proteases')::numeric + 
                    (enzymatic_composition->>'lipases')::numeric + 
                    (enzymatic_composition->>'phytases')::numeric)) * 0.3,
        'phytases', ((enzymatic_composition->>'phytases')::numeric / 
                    ((enzymatic_composition->>'amylases')::numeric + 
                     (enzymatic_composition->>'proteases')::numeric + 
                     (enzymatic_composition->>'lipases')::numeric + 
                     (enzymatic_composition->>'phytases')::numeric)) * 0.3
      )
    ELSE 
      jsonb_build_object(
        'amylases', 0,
        'proteases', 0,
        'lipases', 0,
        'phytases', 0
      )
  END as contribution_enzymesyall
FROM private_flours
WHERE NOT EXISTS (
  SELECT 1 FROM contributionenzymes_private 
  WHERE contributionenzymes_private.flour_id = private_flours.id
)
ON CONFLICT (flour_id) DO NOTHING;
