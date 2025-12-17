/*
  # Add private_flour_categories_id column to private_flours table

  1. Changes
    - Add private_flour_categories_id column to private_flours table
    - Add foreign key constraint to reference private_flour_categories table
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_flours' 
    AND column_name = 'private_flour_categories_id'
  ) THEN
    ALTER TABLE private_flours 
    ADD COLUMN private_flour_categories_id uuid REFERENCES private_flour_categories(id) ON DELETE SET NULL;

    -- Create an index for the foreign key
    CREATE INDEX IF NOT EXISTS idx_private_flours_categories_id 
    ON private_flours(private_flour_categories_id);
  END IF;
END $$;
