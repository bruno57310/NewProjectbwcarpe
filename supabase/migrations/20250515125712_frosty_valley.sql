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
WHERE NOT EXISTS (
  SELECT 1 FROM contributionenzymes 
  WHERE contributionenzymes.flour_id = flours_template.id
)
ON CONFLICT (flour_id) DO NOTHING;

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
WHERE NOT EXISTS (
  SELECT 1 FROM contributionenzymes_private 
  WHERE contributionenzymes_private.flour_id = private_flours.id
)
ON CONFLICT (flour_id) DO NOTHING;
