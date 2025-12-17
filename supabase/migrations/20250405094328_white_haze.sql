/*
  # Remove all images and set defaults

  1. Changes
    - Remove image_url from flour_categories
    - Remove image_url from flours
    - Set default placeholder image in components
*/

-- First, update all flour categories to remove images
UPDATE flour_categories
SET image_url = NULL;

-- Then, update all flours to remove images
UPDATE flours
SET image_url = NULL;
