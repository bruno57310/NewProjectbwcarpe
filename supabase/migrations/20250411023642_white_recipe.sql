/*
  # Add admin role and permissions

  1. Changes
    - Add admin role to auth.users
    - Grant admin role to specific user
    - Update RLS policies to check for admin role

  2. Security
    - Only admin can manage all subscriptions
    - Regular users can only view their own subscription
*/

-- First, add is_admin column to auth.users if it doesn't exist
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set the specific user as admin
UPDATE auth.users 
SET is_admin = true 
WHERE email = 'bruno_wendling@orange.fr';

-- Create or replace function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update subscription policies to use admin check
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
CREATE POLICY "Users can view their own subscription"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.is_admin() = true
);

-- Allow admins to manage all subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
ON subscriptions
FOR ALL
TO authenticated
USING (auth.is_admin() = true)
WITH CHECK (auth.is_admin() = true);
