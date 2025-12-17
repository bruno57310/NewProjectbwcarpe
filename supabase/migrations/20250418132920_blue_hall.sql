/*
  # Fix private_flours insert behavior

  1. Changes
    - Create a trigger function to handle private_flours inserts
    - Ensure user_id_private_flours is always set to the current user
    - Set id to NULL when user_id_private_flours doesn't match current user
    - Prevent duplicate key errors by forcing new record creation

  2. Security
    - Maintains existing RLS policies
    - Ensures proper data ownership
*/

-- Create or replace function to handle private_flours inserts
CREATE OR REPLACE FUNCTION handle_private_flours_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id_private_flours to current user
  NEW.user_id_private_flours := auth.uid();
  
  -- If id is provided but already exists, set to NULL to force new record
  IF NEW.id IS NOT NULL AND EXISTS (
    SELECT 1 FROM private_flours WHERE id = NEW.id
  ) THEN
    NEW.id := NULL;
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
