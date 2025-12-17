/*
  # Add title color fields to text_windows table

  1. Changes
    - Add title_background_color column to text_windows table
    - Add title_text_color column to text_windows table
    - Set default values for backward compatibility
    
  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Add title color columns to text_windows table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'text_windows' 
    AND column_name = 'title_background_color'
  ) THEN
    ALTER TABLE text_windows
    ADD COLUMN title_background_color text DEFAULT '#ffffff';
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'text_windows' 
    AND column_name = 'title_text_color'
  ) THEN
    ALTER TABLE text_windows
    ADD COLUMN title_text_color text DEFAULT '#000000';
  END IF;
END $$;
