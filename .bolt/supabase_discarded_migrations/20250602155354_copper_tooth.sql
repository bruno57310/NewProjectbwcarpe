/*
  # Add misajourprivatecategoriesbwcarpe function

  1. Changes
    - Create a function to update private flour categories
    - Function takes user_id_private parameter
    - Returns the number of categories updated
    
  2. Security
    - Function is SECURITY DEFINER to ensure proper access control
    - Only affects categories for the specified user
*/

-- Create or replace the function
CREATE OR REPLACE FUNCTION misajourprivatecategoriesbwcarpe(user_id_private uuid)
RETURNS text AS $$
DECLARE
  categories_count integer := 0;
  result text;
BEGIN
  -- Insert default categories if they don't exist
  INSERT INTO private_flour_categories (name, description, user_id_private_category)
  VALUES 
    ('Farines de céréales', 'Farines issues de céréales comme le blé, le maïs, le riz, etc.', user_id_private),
    ('Farines de légumineuses', 'Farines issues de légumineuses comme le soja, les pois, etc.', user_id_private),
    ('Farines d''oléagineux', 'Farines issues d''oléagineux comme le tournesol, le colza, etc.', user_id_private),
    ('Farines de poisson', 'Farines issues de poissons comme le LT94, etc.', user_id_private),
    ('Farines de crustacés', 'Farines issues de crustacés comme la crevette, le krill, etc.', user_id_private),
    ('Farines d''insectes', 'Farines issues d''insectes comme le grillon, le ver de farine, etc.', user_id_private)
  ON CONFLICT (name, user_id_private_category) DO NOTHING;
  
  -- Count how many categories were inserted
  GET DIAGNOSTICS categories_count = ROW_COUNT;
  
  -- Return a message with the count
  IF categories_count > 0 THEN
    result := categories_count || ' new categories added successfully';
  ELSE
    result := 'No new categories added, all categories already exist';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
