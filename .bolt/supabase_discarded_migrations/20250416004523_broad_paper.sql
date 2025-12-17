/*
  # Fix private_flours and private_flour_categories relationship

  1. Changes
    - Rename user_id column to user_id_private_category in private_flour_categories if needed
    - Rename user_id column to user_id_private_flours in private_flours if needed
    - Drop and recreate the foreign key constraint between tables
    - Add missing indexes for better performance

  2. Security
    - No changes to security policies
    - Maintains existing RLS configuration
*/

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE private_flours 
DROP CONSTRAINT IF EXISTS private_flours_category_id_fkey;

-- Rename user_id columns if they haven't been renamed already
DO $$ 
BEGIN
  -- Check and rename in private_flour_categories
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'private_flour_categories' 
    AND column_name = 'user_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE private_flour_categories 
    RENAME COLUMN user_id TO user_id_private_category;
  END IF;

  -- Check and rename in private_flours
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'private_flours' 
    AND column_name = 'user_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE private_flours 
    RENAME COLUMN user_id TO user_id_private_flours;
  END IF;
END $$;

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
    AND tablename = 'private_flour_categories'
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX idx_private_flour_categories_name 
    ON private_flour_categories(name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_private_flour_categories_user_id'
    AND tablename = 'private_flour_categories'
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX idx_private_flour_categories_user_id 
    ON private_flour_categories(user_id_private_category);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_private_flours_user_id'
    AND tablename = 'private_flours'
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX idx_private_flours_user_id 
    ON private_flours(user_id_private_flours);
  END IF;
END $$;
