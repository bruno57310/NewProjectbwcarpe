/*
  # Fix subscriptions table RLS policies

  1. Changes
    - Update RLS policies for subscriptions table to allow new users to create their initial free subscription
    - Add specific policy for initial free subscription creation
    - Maintain existing policies for other operations

  2. Security
    - Ensures users can only create free subscriptions for themselves
    - Maintains existing security for other operations
    - Prevents unauthorized subscription modifications
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create initial subscription" ON subscriptions;

-- Create new insert policy that explicitly allows free tier creation
CREATE POLICY "Users can create initial free subscription"
ON subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  auth.uid() = login_id AND 
  tier = 'free'::subscription_tier AND
  active = true
);

-- Ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
