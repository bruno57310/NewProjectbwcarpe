/*
  # Fix private flour categories schema relationship

  1. Changes
    - Drop and recreate foreign key constraint with proper schema reference
    - Ensure proper relationship between tables
    - Maintain existing data integrity

  2. Security
    - No changes to security policies
    - Maintains existing RLS
*/

-- First, ensure both tables exist in the public schema
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.private_flours 
  DROP CONSTRAINT IF EXISTS private_flours_category_id_fkey;

  -- Recreate the constraint with explicit schema references
  ALTER TABLE public.private_flours
  ADD CONSTRAINT private_flours_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES public.private_flour_categories(id)
  ON DELETE SET NULL;

  -- Create index for the foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'private_flours' 
    AND indexname = 'idx_private_flours_category_id'
  ) THEN
    CREATE INDEX idx_private_flours_category_id 
    ON public.private_flours(category_id);
  END IF;
END $$;
