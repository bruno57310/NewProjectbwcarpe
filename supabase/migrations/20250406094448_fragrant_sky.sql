/*
  # Mise à jour de la composition protéique des farines

  1. Changements
    - Mise à jour des valeurs de composition protéique pour toutes les farines
    - Ajustement des ratios albumines/globulines/prolamines/glutélines selon les données scientifiques

  Note: Les valeurs sont basées sur des études scientifiques sur la composition protéique des farines
*/

-- Farine de blé T45
UPDATE flours 
SET protein_composition = '{
  "albumins": 15,
  "globulins": 5,
  "prolamins": 40,
  "glutelins": 40
}'::jsonb
WHERE name = 'Farine de Blé T45';

-- Farine de maïs
UPDATE flours 
SET protein_composition = '{
  "albumins": 4,
  "globulins": 3,
  "prolamins": 55,
  "glutelins": 38
}'::jsonb
WHERE name ILIKE '%Maïs%';

-- Farine de soja
UPDATE flours 
SET protein_composition = '{
  "albumins": 10,
  "globulins": 70,
  "prolamins": 5,
  "glutelins": 15
}'::jsonb
WHERE name ILIKE '%Soja%';

-- Farine d'avoine
UPDATE flours 
SET protein_composition = '{
  "albumins": 20,
  "globulins": 15,
  "prolamins": 15,
  "glutelins": 50
}'::jsonb
WHERE name ILIKE '%Avoine%';

-- Farine de riz
UPDATE flours 
SET protein_composition = '{
  "albumins": 5,
  "globulins": 10,
  "prolamins": 5,
  "glutelins": 80
}'::jsonb
WHERE name ILIKE '%Riz%';

-- Farine de pois
UPDATE flours 
SET protein_composition = '{
  "albumins": 25,
  "globulins": 65,
  "prolamins": 5,
  "glutelins": 5
}'::jsonb
WHERE name ILIKE '%Pois%';

-- Farine de lupin
UPDATE flours 
SET protein_composition = '{
  "albumins": 10,
  "globulins": 85,
  "prolamins": 3,
  "glutelins": 2
}'::jsonb
WHERE name ILIKE '%Lupin%';

-- Farine de chanvre
UPDATE flours 
SET protein_composition = '{
  "albumins": 33,
  "globulins": 65,
  "prolamins": 1,
  "glutelins": 1
}'::jsonb
WHERE name ILIKE '%Chanvre%';

-- Protéines animales (poisson, crevette, krill, etc.)
UPDATE flours 
SET protein_composition = '{
  "albumins": 65,
  "globulins": 33,
  "prolamins": 1,
  "glutelins": 1
}'::jsonb
WHERE category_id IN (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Protéines Animales'
);
