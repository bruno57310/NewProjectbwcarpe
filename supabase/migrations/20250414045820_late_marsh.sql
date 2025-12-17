/*
  # Update private_flours RLS policies

  1. Changes
    - Update RLS policies for private_flours table to properly handle enterprise subscribers
    - Add policies for CRUD operations with proper subscription checks
    
  2. Security
    - Ensure only enterprise subscribers can access private flours
    - Users can only access their own private flours
    - All operations require an active enterprise subscription
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;

-- Create new policies with proper subscription checks
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.user_id = auth.uid() 
    AND subscriptions.tier = 'enterprise' 
    AND subscriptions.active = true
  )
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.user_id = auth.uid() 
    AND subscriptions.tier = 'enterprise' 
    AND subscriptions.active = true
  )
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.user_id = auth.uid() 
    AND subscriptions.tier = 'enterprise' 
    AND subscriptions.active = true
  )
)
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.user_id = auth.uid() 
    AND subscriptions.tier = 'enterprise' 
    AND subscriptions.active = true
  )
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.user_id = auth.uid() 
    AND subscriptions.tier = 'enterprise' 
    AND subscriptions.active = true
  )
);
