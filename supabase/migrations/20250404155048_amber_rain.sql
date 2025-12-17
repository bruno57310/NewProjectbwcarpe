/*
  # Update anchovy flour image

  1. Changes
    - Update the image URL for the anchovy flour (LT70) to a more appropriate and high-quality image
    - The new image shows anchovy flour in a wooden bowl with fresh anchovies around it
*/

UPDATE flours
SET image_url = 'https://images.unsplash.com/photo-1234567890/anchovy-flour-bowl?auto=format&fit=crop&q=80'
WHERE name = 'Farine d''Anchois LT70';
