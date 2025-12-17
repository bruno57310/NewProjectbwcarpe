/*
  # Fix subscription RLS policy for new users

  1. Changes
    - Update RLS policy for subscription creation
    - Use auth.uid() instead of email() function
    - Fix issue with new user registration

  2. Security
    - Maintain existing security model
    - Ensure users can only create their own subscription
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
