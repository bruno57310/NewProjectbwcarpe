/*
  # Populate Enzymatic Contribution Tables

  1. Changes
    - Populate contributionenzymes table with data from flours_template
    - Populate contributionenzymes_private table with data from private_flours
    
  2. Details
    - Calculates total enzyme values
    - Creates proper JSON structure for contribution_enzymesyall
*/

-- Populate contributionenzymes table
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
ON CONFLICT (flour_id) DO UPDATE
SET 
  flour_name = EXCLUDED.flour_name,
  enzymes_contri = EXCLUDED.enzymes_contri,
  enzymes_total_contri = EXCLUDED.enzymes_total_contri,
  contribution_enzymesyall = EXCLUDED.contribution_enzymesyall;

-- Populate contributionenzymes_private table
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
ON CONFLICT (flour_id) DO UPDATE
SET 
  flour_name = EXCLUDED.flour_name,
  enzymes_contri = EXCLUDED.enzymes_contri,
  enzymes_total_contri = EXCLUDED.enzymes_total_contri,
  contribution_enzymesyall = EXCLUDED.contribution_enzymesyall;
