/*
  # Populate Anti-Nutrient Contribution Tables

  1. Changes
    - Populate contributionanti_nutrients table with data from flours_template
    - Populate contributionanti_nutrients_private table with data from private_flours
    
  2. Details
    - Calculates numeric values for anti-nutrients based on low/medium/high settings
    - Creates proper JSON structure for contribution_anti_nutrientsyall
*/

-- Populate contributionanti_nutrients table
INSERT INTO contributionanti_nutrients (
  flour_id,
  flour_name,
  anti_nutrients_contri,
  anti_nutrients_total_contri,
  contribution_anti_nutrientsyall
)
SELECT 
  id,
  name,
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
  ) as anti_nutrients_contri,
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
  END) as anti_nutrients_total_contri,
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
  ) as contribution_anti_nutrientsyall
FROM flours_template
WHERE NOT EXISTS (
  SELECT 1 FROM contributionanti_nutrients 
  WHERE contributionanti_nutrients.flour_id = flours_template.id
)
ON CONFLICT (flour_id) DO NOTHING;

-- Populate contributionanti_nutrients_private table
INSERT INTO contributionanti_nutrients_private (
  flour_id,
  flour_name,
  anti_nutrients_contri,
  anti_nutrients_total_contri,
  contribution_anti_nutrientsyall
)
SELECT 
  id,
  name,
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
  ) as anti_nutrients_contri,
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
  END) as anti_nutrients_total_contri,
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
  ) as contribution_anti_nutrientsyall
FROM private_flours
WHERE NOT EXISTS (
  SELECT 1 FROM contributionanti_nutrients_private 
  WHERE contributionanti_nutrients_private.flour_id = private_flours.id
)
ON CONFLICT (flour_id) DO NOTHING;
