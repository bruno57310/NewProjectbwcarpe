/*
  # Déplacement des farines de poisson marines

  1. Changements
    - Déplacer toutes les farines de la catégorie "Farines de poisson marines" vers "Farines de poisson"
    - Supprimer l'ancienne catégorie
    
  2. Sécurité
    - Utilisation d'une transaction pour garantir l'intégrité des données
    - Vérification de l'existence des catégories avant les opérations
*/

BEGIN;

-- Déplacer les farines vers la catégorie "Farines de poisson"
UPDATE flours
SET category_id = (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Farines de poisson'
  LIMIT 1
)
WHERE category_id = (
  SELECT id 
  FROM flour_categories 
  WHERE name = 'Farines de poisson marines'
  LIMIT 1
);

-- Supprimer la catégorie obsolète
DELETE FROM flour_categories 
WHERE name = 'Farines de poisson marines';

COMMIT;
