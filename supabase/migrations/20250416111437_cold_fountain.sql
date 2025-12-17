/*
  # Add position field to banners table

  1. Changes
    - Add position JSONB column to banners table
    - Store x, y coordinates and width/height dimensions
    - Set default values for backward compatibility
    
  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Add position column to banners table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'banners' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE banners
    ADD COLUMN position jsonb DEFAULT '{
      "x": 0,
      "y": 0,
      "width": "100%",
      "height": "auto"
    }'::jsonb;
  END IF;
END $$;
