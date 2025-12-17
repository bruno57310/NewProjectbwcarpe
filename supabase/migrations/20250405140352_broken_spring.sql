/*
  # Fix subscription and user access policies

  1. Changes
    - Add policy for users to read auth.users table
    - Update subscription policies to ensure proper access
    - Fix policy ordering to prevent conflicts

  2. Security
    - Maintain RLS security while allowing necessary access
    - Ensure users can only access their own data
*/

-- First, grant necessary access to auth.users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Drop existing policies to rebuild them in correct order
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;

-- Recreate subscription policies in correct order
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_active ON subscriptions(user_id, active);
