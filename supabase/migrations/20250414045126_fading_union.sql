/*
  # Fix RLS policies for private_flours table

  1. Changes
    - Drop existing RLS policies for private_flours table
    - Create new, more permissive policies for enterprise users
    - Ensure proper user_id and subscription checks

  2. Security
    - Maintain row-level security
    - Only allow enterprise users to access their own data
    - Verify enterprise subscription status for all operations
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;

-- Create new policies with proper checks
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = auth.uid() 
    AND tier = 'enterprise'::subscription_tier 
    AND active = true
  )
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = auth.uid() 
    AND tier = 'enterprise'::subscription_tier 
    AND active = true
  )
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = auth.uid() 
    AND tier = 'enterprise'::subscription_tier 
    AND active = true
  )
)
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = auth.uid() 
    AND tier = 'enterprise'::subscription_tier 
    AND active = true
  )
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = auth.uid() 
    AND tier = 'enterprise'::subscription_tier 
    AND active = true
  )
);
