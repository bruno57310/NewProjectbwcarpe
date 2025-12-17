/*
  # Fix private_flour_categories CSV import

  1. Changes
    - Create a trigger function to handle CSV imports for private_flour_categories
    - Ensure user_id_private_category is set to the current user's ID
    - Handle cases where the column might be missing or NULL in imported data

  2. Security
    - Maintains existing RLS policies
    - Ensures proper data ownership
*/

-- Create or replace function to handle private_flour_categories inserts
CREATE OR REPLACE FUNCTION handle_private_categories_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id_private_category to current user
  NEW.user_id_private_category := auth.uid();
  
  -- If id is provided but already exists, set to NULL to force new record
  IF NEW.id IS NOT NULL AND EXISTS (
    SELECT 1 FROM private_flour_categories WHERE id = NEW.id
  ) THEN
    NEW.id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS before_insert_private_categories ON private_flour_categories;

-- Create the trigger
CREATE TRIGGER before_insert_private_categories
BEFORE INSERT ON private_flour_categories
FOR EACH ROW
EXECUTE FUNCTION handle_private_categories_insert();
