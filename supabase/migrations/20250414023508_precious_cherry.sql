/*
  # Fix RLS policies for private_flours table

  1. Changes
    - Drop existing RLS policy
    - Create new policy that properly includes user_id on insert
    - Ensure enterprise subscription check works correctly

  2. Security
    - Only enterprise subscribers can access
    - Users can only access their own private flours
    - Maintains data isolation between users
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own private flours" ON private_flours;

-- Create new comprehensive policy
CREATE POLICY "Users can manage their own private flours"
  ON private_flours
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
      AND tier = 'enterprise'
      AND active = true
      AND current_period_end > now()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
      AND tier = 'enterprise'
      AND active = true
      AND current_period_end > now()
    )
  );
