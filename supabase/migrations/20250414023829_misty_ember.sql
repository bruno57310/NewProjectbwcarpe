/*
  # Fix RLS policies for private flours

  1. Changes
    - Drop existing RLS policy
    - Create new policies with proper user_id checks and enterprise subscription validation
    - Separate policies for different operations (SELECT, INSERT, UPDATE, DELETE)

  2. Security
    - Ensure users can only access their own private flours
    - Verify enterprise subscription status
    - Maintain data isolation between users
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own private flours" ON private_flours;

-- Create new granular policies
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
    AND subscriptions.current_period_end > now()
  )
);

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
    AND subscriptions.current_period_end > now()
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
    AND subscriptions.current_period_end > now()
  )
)
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.user_id = auth.uid()
    AND subscriptions.tier = 'enterprise'
    AND subscriptions.active = true
    AND subscriptions.current_period_end > now()
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
    AND subscriptions.current_period_end > now()
  )
);
