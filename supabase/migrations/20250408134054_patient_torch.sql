/*
  # Add RLS policies for flour categories management

  1. Security Changes
    - Add RLS policy for authenticated users to manage flour categories
    - Maintain existing policy for public read access
    - Add policy for authenticated users to insert/update/delete categories

  2. Notes
    - Only authenticated users can modify categories
    - Public users maintain read-only access
    - All authenticated users can manage categories (insert/update/delete)
*/

-- Add policy for authenticated users to insert categories
CREATE POLICY "Users can insert categories"
ON flour_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add policy for authenticated users to update categories
CREATE POLICY "Users can update categories"
ON flour_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add policy for authenticated users to delete categories
CREATE POLICY "Users can delete categories"
ON flour_categories
FOR DELETE
TO authenticated
USING (true);
