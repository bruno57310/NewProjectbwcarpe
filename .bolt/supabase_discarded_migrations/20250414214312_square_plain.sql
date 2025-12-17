/*
  # Fix ambiguous user_id reference in RLS policies

  1. Changes
    - Update RLS policies to use explicit table references
    - Fix ambiguous column references in policies
    - Maintain existing security checks

  2. Security
    - Keep enterprise subscription requirement
    - Maintain user-specific access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can view their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can update their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can delete their own private categories" ON private_flour_categories;

-- Create RLS policies for private_flour_categories with explicit table references
CREATE POLICY "Users can create private categories"
ON private_flour_categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = private_flour_categories.user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private categories"
ON private_flour_categories
FOR SELECT
TO authenticated
USING (
  auth.uid() = private_flour_categories.user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private categories"
ON private_flour_categories
FOR UPDATE
TO authenticated
USING (
  auth.uid() = private_flour_categories.user_id AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = private_flour_categories.user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private categories"
ON private_flour_categories
FOR DELETE
TO authenticated
USING (
  auth.uid() = private_flour_categories.user_id AND 
  has_enterprise_subscription(auth.uid())
);

-- Drop existing policies for private_flours
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;

-- Create RLS policies for private_flours with explicit table references
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = private_flours.user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = private_flours.user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = private_flours.user_id AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = private_flours.user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = private_flours.user_id AND 
  has_enterprise_subscription(auth.uid())
);
