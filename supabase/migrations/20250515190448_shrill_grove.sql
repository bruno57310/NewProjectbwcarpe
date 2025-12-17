/*
  # Add Enzyme Contribution Tables and Functions

  1. New Tables
    - Check if tables already exist before creating them
    - Add proper foreign key relationships
    - Set up RLS policies
    
  2. Security
    - Enable RLS
    - Add policies for admin and users
    - Maintain data isolation
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
BEGIN
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
    (NEW.enzymatic_composition->>'amylases')::numeric + 
    (NEW.enzymatic_composition->>'proteases')::numeric + 
    (NEW.enzymatic_composition->>'lipases')::numeric + 
    (NEW.enzymatic_composition->>'phytases')::numeric,
    NEW.enzymatic_composition
  )
  ON CONFLICT (flour_id) 
  DO UPDATE SET
    flour_name = NEW.name,
    enzymes_contri = NEW.enzymatic_composition,
    enzymes_total_contri = (NEW.enzymatic_composition->>'amylases')::numeric + 
                          (NEW.enzymatic_composition->>'proteases')::numeric + 
                          (NEW.enzymatic_composition->>'lipases')::numeric + 
                          (NEW.enzymatic_composition->>'phytases')::numeric,
    contribution_enzymesyall = NEW.enzymatic_composition;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync enzymatic contributions for private flours
CREATE OR REPLACE FUNCTION sync_contributionenzymes_private()
RETURNS TRIGGER AS $$
BEGIN
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
    (NEW.enzymatic_composition->>'amylases')::numeric + 
    (NEW.enzymatic_composition->>'proteases')::numeric + 
    (NEW.enzymatic_composition->>'lipases')::numeric + 
    (NEW.enzymatic_composition->>'phytases')::numeric,
    NEW.enzymatic_composition
  )
  ON CONFLICT (flour_id) 
  DO UPDATE SET
    flour_name = NEW.name,
    enzymes_contri = NEW.enzymatic_composition,
    enzymes_total_contri = (NEW.enzymatic_composition->>'amylases')::numeric + 
                          (NEW.enzymatic_composition->>'proteases')::numeric + 
                          (NEW.enzymatic_composition->>'lipases')::numeric + 
                          (NEW.enzymatic_composition->>'phytases')::numeric,
    contribution_enzymesyall = NEW.enzymatic_composition;
  
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
  (enzymatic_composition->>'phytases')::numeric,
  enzymatic_composition
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
  (enzymatic_composition->>'phytases')::numeric,
  enzymatic_composition
FROM private_flours
WHERE NOT EXISTS (
  SELECT 1 FROM contributionenzymes_private 
  WHERE contributionenzymes_private.flour_id = private_flours.id
)
ON CONFLICT (flour_id) DO NOTHING;
