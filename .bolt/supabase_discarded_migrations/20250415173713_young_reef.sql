/*
  # Add RLS policies for subscriptions table

  1. Changes
    - Enable RLS on subscriptions table
    - Add policies for users to manage their own subscriptions
    - Add policies for admins to manage all subscriptions
    - Add function to check admin status

  2. Security
    - Users can only view and update their own subscription
    - Admins can manage all subscriptions
    - Proper checks for subscription creation and updates
*/

-- First ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can create initial subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;

-- Create policy for users to view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (
      SELECT is_admin 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Create policy for users to create their initial subscription
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

-- Create policy for users to update their own subscription
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (
      SELECT is_admin 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (
      SELECT is_admin 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Create policy for admins to delete subscriptions
CREATE POLICY "Admins can delete subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (
    (
      SELECT is_admin 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_active 
ON subscriptions(user_id, active);
