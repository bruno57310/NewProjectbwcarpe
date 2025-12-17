/*
  # Add admin policy for private_flours table if it doesn't exist

  1. Changes
    - Check if policy already exists before creating it
    - Add specific policy for bruno_wendling@orange.fr to manage all private_flours
    - Use email() function for admin identification

  2. Security
    - Only the admin user can manage all private flours
    - Regular users can still only access their own data with enterprise subscription
*/

-- Check if policy exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'private_flours' 
    AND policyname = 'Admin can manage all private flours'
  ) THEN
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
  END IF;
END $$;
