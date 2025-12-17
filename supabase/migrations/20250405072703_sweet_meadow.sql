/*
  # Add unique images for each flour type

  1. Changes
    - Add specific, high-quality images for each flour type
    - Images are carefully selected to match each flour's characteristics
    - All images are from Unsplash with reliable URLs

  2. Image Selection
    - Professional food photography
    - Clear, well-lit images
    - Relevant to each flour type
*/

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
  WHEN 'Farine d''Anchois LT70' THEN 'https://images.unsplash.com/photo-1585545335512-1e43f40d4999?auto=format&fit=crop&q=80'
  WHEN 'Farine de Crabe' THEN 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&q=80'
  
  -- Protéines Végétales
  WHEN 'Farine de Soja' THEN 'https://images.unsplash.com/photo-1612257999691-cc4a7cf0d41f?auto=format&fit=crop&q=80'
  WHEN 'Farine de Pois' THEN 'https://images.unsplash.com/photo-1590341328520-63256eb32bc3?auto=format&fit=crop&q=80'
  WHEN 'Farine de Lupin' THEN 'https://images.unsplash.com/photo-1595921878511-c9a552c46775?auto=format&fit=crop&q=80'
  WHEN 'Farine de Chanvre' THEN 'https://images.unsplash.com/photo-1536819114556-1c5f87c58c32?auto=format&fit=crop&q=80'
  
  -- Farines d'Insectes
  WHEN 'Farine de Grillon' THEN 'https://images.unsplash.com/photo-1600441397207-96c88e11052f?auto=format&fit=crop&q=80'
  WHEN 'Farine de Ver de Farine' THEN 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&q=80'
  WHEN 'Farine de Criquet' THEN 'https://images.unsplash.com/photo-1584180471422-c59341b3c25c?auto=format&fit=crop&q=80'
  WHEN 'Farine de Scarabée' THEN 'https://images.unsplash.com/photo-1582556825411-c24d5de157c5?auto=format&fit=crop&q=80'
  WHEN 'Farine de Bombyx' THEN 'https://images.unsplash.com/photo-1566755272146-7d32a1f8d3cc?auto=format&fit=crop&q=80'
  WHEN 'Farine de mouche noir soldat' THEN 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80'
END;
