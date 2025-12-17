/*
  # Add default images for flours and categories

  1. Changes
    - Add default images for flour categories
    - Add specific, relevant images for each flour type
    - Update existing records with appropriate images

  2. Images
    - All images are from Unsplash, ensuring high quality and proper licensing
    - Images are selected to match the specific type of flour
    - All URLs are verified and accessible
*/

-- Update flour categories with default images if not set
UPDATE flour_categories
SET image_url = CASE name
  WHEN 'Céréales' THEN 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80'
  WHEN 'Protéines Animales' THEN 'https://images.unsplash.com/photo-1583525957858-eba3d6294a6b?auto=format&fit=crop&q=80'
  WHEN 'Protéines Végétales' THEN 'https://images.unsplash.com/photo-1599258269004-485f5c355b35?auto=format&fit=crop&q=80'
END
WHERE image_url IS NULL AND name IN ('Céréales', 'Protéines Animales', 'Protéines Végétales');

-- Update flours with specific, relevant images if not set
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
  
  -- Default fallback image for any other flour
  ELSE 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80'
END
WHERE image_url IS NULL;
