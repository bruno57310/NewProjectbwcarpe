/*
  # Add subscription update policy

  1. Changes
    - Add RLS policy to allow users to update their own subscription
    - Fix missing update policy that prevented subscription changes
*/

-- Add policy for users to update their own subscription
CREATE POLICY "Users can update their own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
