/*
  # Fix subscription RLS policy for new users

  1. Changes
    - Drop existing insert policy
    - Create new insert policy with less restrictive checks
    - Allow new users to create their initial subscription

  2. Security
    - Maintain existing security model
    - Ensure users can only create their own subscription
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create initial subscription" ON subscriptions;

-- Create new insert policy with proper checks
CREATE POLICY "Users can create initial subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = login_id
  );
