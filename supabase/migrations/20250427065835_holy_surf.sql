/*
  # Add full admin access to subscriptions table

  1. Changes
    - Create a dedicated policy for bruno_wendling@orange.fr to have full access to subscriptions table
    - Ensure admin can manage all subscriptions regardless of login_id
    - Maintain existing policies for regular users

  2. Security
    - Only the specified admin email can access all subscriptions
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
  EXISTS (
    SELECT *
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = 'bruno_wendling@orange.fr'
  )
)
WITH CHECK (
  EXISTS (
    SELECT *
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = 'bruno_wendling@orange.fr'
  )
);
