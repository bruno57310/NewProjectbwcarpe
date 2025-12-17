/*
  # Add Enzymatic Contribution Tables

  1. New Tables
    - `contributionenzymes`: Store enzymatic contribution values for public flours
    - `contributionenzymes_private`: Store enzymatic contribution values for private flours
    
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
    
    -- Create updated_at trigger
    CREATE TRIGGER update_contributionenzymes_updated_at
      BEFORE UPDATE ON contributionenzymes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
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
    
    -- Create updated_at trigger
    CREATE TRIGGER update_contributionenzymes_private_updated_at
      BEFORE UPDATE ON contributionenzymes_private
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create RLS policies for contributionenzymes if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributionenzymes') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Admin can manage all contributions" ON contributionenzymes;
    DROP POLICY IF EXISTS "Users can view contributions" ON contributionenzymes;
    
    -- Create new policies
    CREATE POLICY "Admin can manage all contributions"
      ON contributionenzymes
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

    CREATE POLICY "Users can view contributions"
      ON contributionenzymes
      FOR SELECT
      TO authenticated
      USING (has_paid_subscription(auth.uid()));
  END IF;
END $$;

-- Create RLS policies for contributionenzymes_private if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributionenzymes_private') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Admin can manage all private contributions" ON contributionenzymes_private;
    DROP POLICY IF EXISTS "Users can view their own private contributions" ON contributionenzymes_private;
    
    -- Create new policies
    CREATE POLICY "Admin can manage all private contributions"
      ON contributionenzymes_private
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

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
