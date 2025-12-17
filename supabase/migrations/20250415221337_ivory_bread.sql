/*
  # Add home banner with title

  1. Changes
    - Insert new banner for home page
    - Set title and content
    - Make banner active
    
  2. Details
    - Banner will be displayed on home page
    - No date restrictions (always visible)
*/

INSERT INTO banners (
  title,
  content,
  placement,
  active
)
VALUES (
  'Concepteur et revendeur d''appât pour la pêche à la Carpe',
  'Solutions professionnelles pour la pêche à la carpe',
  'home',
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  active = EXCLUDED.active;
