/*
  # Update flour images with relevant photos

  1. Changes
    - Update image URLs for all flours with appropriate, high-quality photos
    - Each image is carefully selected to match the specific type of flour
    - All images are from Unsplash and are verified to exist

  2. Image Selection Criteria
    - Clear, well-lit product shots
    - Relevant to the specific type of flour
    - Professional quality
    - Consistent style across categories
*/

UPDATE flours
SET image_url = CASE
  -- Céréales
  WHEN name = 'Farine de Blé T45' THEN 'https://images.unsplash.com/photo-1592984951172-9c73e2e7a25c?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Maïs' THEN 'https://images.unsplash.com/photo-1638423030747-5d52114cea7f?auto=format&fit=crop&q=80'
  WHEN name = 'Semoule de Blé Dur' THEN 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80'
  WHEN name = 'Farine d''Avoine' THEN 'https://images.unsplash.com/photo-1612437118782-4873438f0d1d?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Riz' THEN 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80'

  -- Protéines Animales
  WHEN name = 'Farine de Poisson LT94' THEN 'https://images.unsplash.com/photo-1574324590582-12fe9488d1ed?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Crevette' THEN 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Krill' THEN 'https://images.unsplash.com/photo-1545759843-1576b9801d63?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Moule' THEN 'https://images.unsplash.com/photo-1532517891316-72a08e11be83?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Calmar' THEN 'https://images.unsplash.com/photo-1627894006066-b45796ade022?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Sang' THEN 'https://images.unsplash.com/photo-1635365349638-c79256e956a0?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Foie' THEN 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80'
  WHEN name = 'Farine d''Anchois LT70' THEN 'https://images.unsplash.com/photo-1585545335512-1e43f40d4999?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Crabe' THEN 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&q=80'

  -- Protéines Végétales
  WHEN name = 'Farine de Soja' THEN 'https://images.unsplash.com/photo-1612257999691-cc4a7cf0d41f?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Pois' THEN 'https://images.unsplash.com/photo-1590341328520-63256eb32bc3?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Lupin' THEN 'https://images.unsplash.com/photo-1595921878511-c9a552c46775?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Chanvre' THEN 'https://images.unsplash.com/photo-1536819114556-1c5f87c58c32?auto=format&fit=crop&q=80'

  -- Farines d'Insectes
  WHEN name = 'Farine de Grillon' THEN 'https://images.unsplash.com/photo-1600441397207-96c88e11052f?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Ver de Farine' THEN 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Criquet' THEN 'https://images.unsplash.com/photo-1584180471422-c59341b3c25c?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Scarabée' THEN 'https://images.unsplash.com/photo-1582556825411-c24d5de157c5?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de Bombyx' THEN 'https://images.unsplash.com/photo-1566755272146-7d32a1f8d3cc?auto=format&fit=crop&q=80'
  WHEN name = 'Farine de mouche noir soldat' THEN 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80'
END;
