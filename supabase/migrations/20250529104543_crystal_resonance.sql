/*
  # Fix RLS policy for private flour categories

  1. Changes
    - Drop existing INSERT policy for private flour categories
    - Create new INSERT policy with correct enterprise subscription check
    - Add explicit check for user_id_private_category matching auth.uid()

  2. Security
    - Maintains RLS enforcement
    - Ensures users can only create categories for themselves
    - Verifies enterprise subscription status
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create private categories" ON private_flour_categories;

-- Create new INSERT policy with correct conditions
CREATE POLICY "Users can create private categories"
ON private_flour_categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id_private_category AND 
  (
    SELECT has_enterprise_subscription(auth.uid())
  )
);
