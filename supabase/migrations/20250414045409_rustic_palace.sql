/*
  # Add user_id column to flours table

  1. Changes
    - Add `user_id` column to `flours` table
    - Add foreign key constraint referencing users table
    - Add index for performance
    - Update RLS policies to include user_id checks

  2. Security
    - Maintain existing RLS policies
    - Add user_id checks to ensure users can only access their own flours
*/

-- Add user_id column
ALTER TABLE flours
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_flours_user_id ON flours(user_id);

-- Update RLS policies to include user_id checks
DROP POLICY IF EXISTS "Allow authenticated users to manage flours" ON flours;
CREATE POLICY "Allow authenticated users to manage flours"
ON flours
FOR ALL
TO authenticated
USING (
  (user_id = auth.uid() OR user_id IS NULL)
)
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL)
);

-- Keep the public preview access policy unchanged since it doesn't need user_id check
DROP POLICY IF EXISTS "Allow public preview access to flours" ON flours;
CREATE POLICY "Allow public preview access to flours"
ON flours
FOR SELECT
TO public
USING (true);
