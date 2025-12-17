/*
  # Fix subscription permissions and access

  1. Changes
    - Grant proper access to auth schema and users table
    - Update has_paid_subscription function to avoid users table access
    - Add proper RLS policies for subscriptions table

  2. Security
    - Ensure proper access control
    - Maintain data isolation between users
*/

-- Revoke previous grants to clean up
REVOKE ALL ON auth.users FROM authenticated;
REVOKE ALL ON SCHEMA auth FROM authenticated;

-- Update has_paid_subscription function to avoid users table access
CREATE OR REPLACE FUNCTION has_paid_subscription(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE subscriptions.user_id = user_id
    AND tier != 'free'
    AND active = true
    AND current_period_end > now()
  );
END;
$$ language plpgsql security definer;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON subscriptions;

-- Recreate subscription policies
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_active 
ON subscriptions(user_id, active);

-- Update subscription status function
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS trigger AS $$
BEGIN
  -- Only update status if necessary
  IF NEW.current_period_end < now() AND NEW.active = true THEN
    NEW.active := false;
  END IF;
  RETURN NEW;
END;
$$ language plpgsql security definer;
