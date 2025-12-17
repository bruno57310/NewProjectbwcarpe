/*
  # Fix private_flours relationship with categories

  1. Changes
    - Drop existing foreign key constraint
    - Update foreign key relationship
    - Add proper indexes
    - Avoid duplicate constraint error

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data relationships
*/

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE private_flours 
DROP CONSTRAINT IF EXISTS private_flours_category_id_fkey;

-- Add the new foreign key constraint
ALTER TABLE private_flours
ADD CONSTRAINT private_flours_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES private_flour_categories(id)
ON DELETE SET NULL;

-- Create indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_private_flour_categories_name'
  ) THEN
    CREATE INDEX idx_private_flour_categories_name 
    ON private_flour_categories(name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_private_flour_categories_user_id'
  ) THEN
    CREATE INDEX idx_private_flour_categories_user_id 
    ON private_flour_categories(user_id_private_category);
  END IF;
END $$;
