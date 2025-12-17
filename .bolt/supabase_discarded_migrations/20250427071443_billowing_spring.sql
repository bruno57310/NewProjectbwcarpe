-- Drop existing admin policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON subscriptions;

-- Create comprehensive admin policy
CREATE POLICY "Admin can manage all subscriptions"
ON subscriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = 'bruno_wendling@orange.fr'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = 'bruno_wendling@orange.fr'
  )
);
