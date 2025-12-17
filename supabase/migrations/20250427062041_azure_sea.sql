/*
  # Fix subscriptions RLS policies

  1. Changes
    - Update RLS policies for subscriptions table to allow new users to create their initial free subscription
    - Ensure proper access control for subscription management

  2. Security
    - Enable RLS on subscriptions table
    - Add policies for:
      - Initial subscription creation
      - Subscription management
      - Subscription viewing
*/

-- First ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can create initial subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admin can delete subscriptions" ON subscriptions;

-- Create new policies with proper checks
CREATE POLICY "Users can create initial subscription"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = login_id AND
  tier = 'free'::subscription_tier AND
  NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE login_id = auth.uid()
  )
);

CREATE POLICY "Users can update subscription"
ON subscriptions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = login_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'bruno_wendling@orange.fr' 
    AND id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = login_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'bruno_wendling@orange.fr' 
    AND id = auth.uid()
  )
);

CREATE POLICY "Users can view their own subscription"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  auth.uid() = login_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'bruno_wendling@orange.fr' 
    AND id = auth.uid()
  )
);

CREATE POLICY "Admin can delete subscriptions"
ON subscriptions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'bruno_wendling@orange.fr' 
    AND id = auth.uid()
  )
);
