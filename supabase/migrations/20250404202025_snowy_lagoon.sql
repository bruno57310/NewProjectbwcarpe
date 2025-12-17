/*
  # Update LT94 Fish Meal Image

  Updates the image URL for the LT94 fish meal flour to use the new provided image.
*/

DO $$ 
BEGIN
  UPDATE flours 
  SET image_url = 'https://images.unsplash.com/photo-1709322297186-7e0bad5d381c?auto=format&fit=crop&q=80'
  WHERE name = 'Farine de Poisson LT94';
END $$;
