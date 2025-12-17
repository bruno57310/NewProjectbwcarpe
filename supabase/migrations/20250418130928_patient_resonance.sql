/*
  # Fix private_flours duplicate key error

  1. Changes
    - Add a function to handle private_flours inserts
    - Function checks if user_id_private_flours is different from auth.uid()
    - If different, sets id to NULL to force new record creation
    - Maintains all other data integrity

  2. Security
    - Maintains existing RLS policies
    - Ensures users can only create records for themselves
*/

-- Create or replace function to handle private_flours inserts
CREATE OR REPLACE FUNCTION handle_private_flours_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If Type is 'Mise a jour' and user_id_private_flours is different from auth.uid()
  -- Set id to NULL to force a new record creation
  IF NEW.user_id_private_flours IS NOT NULL AND 
     NEW.user_id_private_flours != auth.uid() THEN
    NEW.id := NULL;
    NEW.user_id_private_flours := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS before_insert_private_flours ON private_flours;

-- Create the trigger
CREATE TRIGGER before_insert_private_flours
BEFORE INSERT ON private_flours
FOR EACH ROW
EXECUTE FUNCTION handle_private_flours_insert();
