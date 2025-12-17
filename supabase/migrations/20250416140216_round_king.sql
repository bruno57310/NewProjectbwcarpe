/*
  # Add Carp Food Concept Banner

  1. Changes
    - Add a new banner for the catalog page
    - Set title to "Carp food concept"
    - Make banner active with no date restrictions
    
  2. Details
    - Banner will be displayed on catalog page
    - No date restrictions (always visible)
*/

INSERT INTO banners (
  title,
  content,
  placement,
  active,
  position
)
VALUES (
  'Carp food concept',
  'Solutions innovantes pour l''alimentation des carpes',
  'catalog',
  true,
  '{
    "x": 0,
    "y": 0,
    "width": "100%",
    "height": "auto"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  active = EXCLUDED.active,
  position = EXCLUDED.position;
