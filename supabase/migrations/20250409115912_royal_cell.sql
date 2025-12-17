/*
  # Fix subscription RLS policies

  1. Changes
    - Add policy for initial subscription creation
    - Add policy for subscription updates
    - Ensure proper RLS configuration for subscriptions table

  2. Security
    - Allow users to create their initial subscription
    - Allow users to update their own subscription
    - Maintain existing read policies
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create initial subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- Create policy for initial subscription creation
CREATE POLICY "Users can create initial subscription"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = auth.uid()
  )
);

-- Create policy for subscription updates
CREATE POLICY "Users can update own subscription"
ON subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
