/*
  # Fix admin access to all subscriptions

  1. Changes
    - Create a comprehensive policy for admin to manage all subscriptions
    - Use auth.email() function to identify admin user
    - Ensure proper access control for all operations

  2. Security
    - Only bruno_wendling@orange.fr can access all subscriptions
    - Regular users can still only access their own subscriptions
*/

-- Drop existing admin policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON subscriptions;

-- Create comprehensive admin policy
CREATE POLICY "Admin can manage all subscriptions"
ON subscriptions
FOR ALL
TO authenticated
USING (
  auth.email() = 'bruno_wendling@orange.fr'
)
WITH CHECK (
  auth.email() = 'bruno_wendling@orange.fr'
);
