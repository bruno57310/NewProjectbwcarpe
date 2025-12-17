/*
  # Add admin policy for private_flours table

  1. Changes
    - Add specific policy for bruno_wendling@orange.fr to manage all private_flours
    - Maintain existing policies for regular users
    - Use email() function for admin identification

  2. Security
    - Only the admin user can manage all private flours
    - Regular users can still only access their own data with enterprise subscription
*/

-- Create a specific policy for the admin user to manage all private flours
CREATE POLICY "Admin can manage all private flours"
ON private_flours
FOR ALL
TO authenticated
USING (
  auth.email() = 'bruno_wendling@orange.fr'
)
WITH CHECK (
  auth.email() = 'bruno_wendling@orange.fr'
);
