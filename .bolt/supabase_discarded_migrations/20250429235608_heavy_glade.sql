/*
  # Fix RLS policies for private_flour_categories table

  1. Changes
    - Update RLS policies for private_flour_categories table
    - Fix user_id_private_category column reference in policies
    - Ensure proper enterprise subscription check

  2. Security
    - Only enterprise subscribers can access
    - Users can only access their own private categories
    - Admin can manage all categories
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can view their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can update their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can delete their own private categories" ON private_flour_categories;

-- Create new policies with proper column references
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

-- Add admin policy to manage all categories
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
