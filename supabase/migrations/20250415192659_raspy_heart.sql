/*
  # Update RLS policies for subscriptions table

  1. Changes
    - Add policies for admin user to have full access
    - Update existing policies to use email() function
    - Maintain existing user access policies
    
  2. Security
    - Give full access to bruno_wendling@orange.fr
    - Maintain data isolation for other users
*/

-- First ensure RLS is enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can create initial subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;

-- Create policy for users to view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = login_id OR 
    auth.email() = 'bruno_wendling@orange.fr'
  );

-- Create policy for users to create their initial subscription
CREATE POLICY "Users can create initial subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = login_id AND
    NOT EXISTS (
      SELECT 1 
      FROM subscriptions 
      WHERE login_id = auth.uid()
    )
  );

-- Create policy for users to update subscriptions
CREATE POLICY "Users can update subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = login_id OR 
    auth.email() = 'bruno_wendling@orange.fr'
  )
  WITH CHECK (
    auth.uid() = login_id OR 
    auth.email() = 'bruno_wendling@orange.fr'
  );

-- Create policy for admin to delete subscriptions
CREATE POLICY "Admin can delete subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (
    auth.email() = 'bruno_wendling@orange.fr'
  );

-- Create index for better performance
DROP INDEX IF EXISTS idx_subscriptions_login_id_active;
CREATE INDEX idx_subscriptions_login_id_active 
ON subscriptions(login_id, active);
