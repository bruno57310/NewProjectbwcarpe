/*
  # Add tags column to saved_mixes table

  1. Changes
    - Add `tags` column to `saved_mixes` table as TEXT[]
    - Set default value to empty array
    - Make column nullable

  2. Security
    - No additional security measures needed as the table already has RLS policies
*/

ALTER TABLE saved_mixes 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
