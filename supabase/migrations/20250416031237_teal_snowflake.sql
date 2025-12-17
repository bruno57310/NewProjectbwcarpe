/*
  # Fix private_flours foreign key relationship

  1. Changes
    - Safely check if constraint exists before attempting to add it
    - Add foreign key relationship between private_flours.private_flour_categories_id and private_flour_categories.id
    - Add index on private_flour_categories_id for better query performance
    
  2. Security
    - No changes to RLS policies
*/

-- Check if constraint exists before adding it
DO $$ 
BEGIN
  -- Only add constraint if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'private_flours_private_flour_categories_id_fkey'
      AND table_name = 'private_flours'
  ) THEN
    -- Add foreign key relationship
    ALTER TABLE private_flours
    ADD CONSTRAINT private_flours_private_flour_categories_id_fkey
    FOREIGN KEY (private_flour_categories_id)
    REFERENCES private_flour_categories(id)
    ON DELETE SET NULL;
  END IF;
  
  -- Create index for better performance if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_private_flours_private_flour_categories_id'
  ) THEN
    CREATE INDEX idx_private_flours_private_flour_categories_id 
    ON private_flours(private_flour_categories_id);
  END IF;
END $$;
