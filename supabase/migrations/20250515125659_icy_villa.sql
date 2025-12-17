/*
  # Add Sync Functions for Enzymatic Contributions

  1. New Functions
    - `sync_contributionenzymes`: Sync enzymatic contribution data for public flours
    - `sync_contributionenzymes_private`: Sync enzymatic contribution data for private flours
    
  2. Triggers
    - Add triggers to automatically sync data when flours are updated
*/

-- Drop existing functions and triggers to avoid conflicts
DROP TRIGGER IF EXISTS trg_sync_contributionenzymes ON flours_template;
DROP TRIGGER IF EXISTS trg_sync_contributionenzymes_private ON private_flours;
DROP FUNCTION IF EXISTS sync_contributionenzymes();
DROP FUNCTION IF EXISTS sync_contributionenzymes_private();

-- Create function to sync enzymatic contributions for public flours
CREATE FUNCTION sync_contributionenzymes()
RETURNS TRIGGER AS $$
DECLARE
  total_enzymes numeric;
  enzymes_json jsonb;
BEGIN
  -- Calculate total enzymes
  total_enzymes := (NEW.enzymatic_composition->>'amylases')::numeric + 
                  (NEW.enzymatic_composition->>'proteases')::numeric + 
                  (NEW.enzymatic_composition->>'lipases')::numeric + 
                  (NEW.enzymatic_composition->>'phytases')::numeric;
  
  -- Create JSON for individual enzyme contributions
  enzymes_json := jsonb_build_object(
    'amylases', (NEW.enzymatic_composition->>'amylases')::numeric,
    'proteases', (NEW.enzymatic_composition->>'proteases')::numeric,
    'lipases', (NEW.enzymatic_composition->>'lipases')::numeric,
    'phytases', (NEW.enzymatic_composition->>'phytases')::numeric
  );
  
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
    enzymes_json,
    total_enzymes,
    enzymes_json
  )
  ON CONFLICT (flour_id) 
  DO UPDATE SET
    flour_name = NEW.name,
    enzymes_contri = enzymes_json,
    enzymes_total_contri = total_enzymes,
    contribution_enzymesyall = enzymes_json;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync enzymatic contributions for private flours
CREATE FUNCTION sync_contributionenzymes_private()
RETURNS TRIGGER AS $$
DECLARE
  total_enzymes numeric;
  enzymes_json jsonb;
BEGIN
  -- Calculate total enzymes
  total_enzymes := (NEW.enzymatic_composition->>'amylases')::numeric + 
                  (NEW.enzymatic_composition->>'proteases')::numeric + 
                  (NEW.enzymatic_composition->>'lipases')::numeric + 
                  (NEW.enzymatic_composition->>'phytases')::numeric;
  
  -- Create JSON for individual enzyme contributions
  enzymes_json := jsonb_build_object(
    'amylases', (NEW.enzymatic_composition->>'amylases')::numeric,
    'proteases', (NEW.enzymatic_composition->>'proteases')::numeric,
    'lipases', (NEW.enzymatic_composition->>'lipases')::numeric,
    'phytases', (NEW.enzymatic_composition->>'phytases')::numeric
  );
  
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
    enzymes_json,
    total_enzymes,
    enzymes_json
  )
  ON CONFLICT (flour_id) 
  DO UPDATE SET
    flour_name = NEW.name,
    enzymes_contri = enzymes_json,
    enzymes_total_contri = total_enzymes,
    contribution_enzymesyall = enzymes_json;
  
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
