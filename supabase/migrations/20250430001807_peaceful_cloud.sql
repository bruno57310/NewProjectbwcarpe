/*
  # Fix RLS policies for private_flour_categories table

  1. Changes
    - Drop existing RLS policies for private_flour_categories
    - Create new policies with correct column references
    - Add admin policy for full access
    - Ensure enterprise subscription check works correctly

  2. Security
    - Only enterprise subscribers can access
    - Users can only access their own private categories
    - Admin has full access to all categories
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can view their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can update their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can delete their own private categories" ON private_flour_categories;

-- Create new policies with correct column references
CREATE POLICY "Users can create private categories"
ON private_flour_categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private categories"
ON private_flour_categories
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private categories"
ON private_flour_categories
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private categories"
ON private_flour_categories
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

-- Add admin policy for full access
CREATE POLICY "Admin can manage all private categories"
ON private_flour_categories
FOR ALL
TO authenticated
USING (
  auth.email() = 'bruno_wendling@orange.fr'
)
WITH CHECK (
  auth.email() = 'bruno_wendling@orange.fr'
);

-- Ensure RLS is enabled
ALTER TABLE private_flour_categories ENABLE ROW LEVEL SECURITY;
