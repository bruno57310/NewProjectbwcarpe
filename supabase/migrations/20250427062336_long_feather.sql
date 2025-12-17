/*
  # Fix subscription RLS policy for new users

  1. Changes
    - Update RLS policy for subscription creation
    - Allow users to create their initial subscription
    - Fix issue with new user registration

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
