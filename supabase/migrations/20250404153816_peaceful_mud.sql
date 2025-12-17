/*
  # Update flour and category images

  1. Changes
    - Add specific, descriptive images for flour categories
    - Add detailed, relevant images for each flour type
  
  2. Image Sources
    - All images are from Unsplash, carefully selected for each flour type
    - High-quality, relevant images that accurately represent each product
*/

-- Update category images
UPDATE flour_categories
SET image_url = CASE name
  WHEN 'Céréales' THEN 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80'
  WHEN 'Protéines Animales' THEN 'https://images.unsplash.com/photo-1583525957858-eba3d6294a6b?auto=format&fit=crop&q=80'
  WHEN 'Protéines Végétales' THEN 'https://images.unsplash.com/photo-1599258269004-485f5c355b35?auto=format&fit=crop&q=80'
END
WHERE name IN ('Céréales', 'Protéines Animales', 'Protéines Végétales');

-- Update flour images with specific, relevant images
UPDATE flours
SET image_url = CASE name
  -- Céréales
  WHEN 'Farine de Maïs' THEN 'https://images.unsplash.com/photo-1624371414361-e670edf4698d?auto=format&fit=crop&q=80'
  WHEN 'Farine de Blé T45' THEN 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80'
  WHEN 'Semoule de Blé Dur' THEN 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80'
  WHEN 'Farine d''Avoine' THEN 'https://images.unsplash.com/photo-1595661671412-e20c4a3e65cc?auto=format&fit=crop&q=80'
  WHEN 'Farine de Riz' THEN 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80'
  
  -- Protéines Animales
  WHEN 'Farine de Poisson LT94' THEN 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80'
  WHEN 'Farine de Crevette' THEN 'https://images.unsplash.com/photo-1565680018434-b583b34e45e5?auto=format&fit=crop&q=80'
  WHEN 'Farine de Krill' THEN 'https://images.unsplash.com/photo-1589980655912-a66c782c3014?auto=format&fit=crop&q=80'
  WHEN 'Farine de Moule' THEN 'https://images.unsplash.com/photo-1532517891316-72a08e11be83?auto=format&fit=crop&q=80'
  WHEN 'Farine de Calmar' THEN 'https://images.unsplash.com/photo-1545759843-1576b9801d63?auto=format&fit=crop&q=80'
  WHEN 'Farine de Sang' THEN 'https://images.unsplash.com/photo-1584555613497-7a74a3fd9e4f?auto=format&fit=crop&q=80'
  WHEN 'Farine de Foie' THEN 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80'
  
  -- Protéines Végétales
  WHEN 'Farine de Soja' THEN 'https://images.unsplash.com/photo-1612257999691-cc4a7cf0d41f?auto=format&fit=crop&q=80'
  WHEN 'Farine de Pois' THEN 'https://images.unsplash.com/photo-1590341328520-63256eb32bc3?auto=format&fit=crop&q=80'
  WHEN 'Farine de Lupin' THEN 'https://images.unsplash.com/photo-1595921878511-c9a552c46775?auto=format&fit=crop&q=80'
  WHEN 'Farine de Chanvre' THEN 'https://images.unsplash.com/photo-1536819114556-1c5f87c58c32?auto=format&fit=crop&q=80'
END
WHERE name IN (
  'Farine de Maïs', 'Farine de Blé T45', 'Semoule de Blé Dur', 'Farine d''Avoine', 'Farine de Riz',
  'Farine de Poisson LT94', 'Farine de Crevette', 'Farine de Krill', 'Farine de Moule', 'Farine de Calmar',
  'Farine de Sang', 'Farine de Foie', 'Farine de Soja', 'Farine de Pois', 'Farine de Lupin', 'Farine de Chanvre'
);
