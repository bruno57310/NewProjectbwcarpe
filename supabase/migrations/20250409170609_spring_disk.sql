/*
  # Add tags column to saved_mixes table

  1. Changes
    - Add tags column to saved_mixes table
    - Set default value to empty array
    - Allow NULL values

  2. Notes
    - Uses TEXT[] type for array of strings
    - Maintains existing data
*/

ALTER TABLE saved_mixes 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
