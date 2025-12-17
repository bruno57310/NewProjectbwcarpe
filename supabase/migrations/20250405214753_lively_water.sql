/*
  # Suppression de la catégorie Farines de poisson d'eau douce

  1. Changements
    - Déplacer les farines de cette catégorie vers "Protéines Animales"
    - Supprimer la catégorie obsolète
    
  2. Sécurité
    - Utilisation d'une transaction pour garantir l'intégrité des données
    - Vérification de l'existence de la catégorie avant suppression
*/

BEGIN;

-- Déplacer les farines vers la catégorie "Protéines Animales"
UPDATE flours
SET category_id = (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Protéines Animales'
  LIMIT 1
)
WHERE category_id = (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Farines de poisson d''eau douce'
  LIMIT 1
);

-- Supprimer la catégorie
DELETE FROM flour_categories 
WHERE name = 'Farines de poisson d''eau douce';

COMMIT;
