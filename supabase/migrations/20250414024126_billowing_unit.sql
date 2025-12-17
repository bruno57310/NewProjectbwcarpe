/*
  # Update private_flours RLS policies

  1. Changes
    - Modify RLS policies to properly check user subscription status
    - Add helper function to check enterprise subscription

  2. Security
    - Ensure users can only access their own private flours
    - Verify enterprise subscription status before allowing operations
*/

-- Create a function to check if a user has an active enterprise subscription
CREATE OR REPLACE FUNCTION has_enterprise_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = user_uuid
      AND tier = 'enterprise'
      AND active = true
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;

-- Create new policies with proper subscription checks
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND has_enterprise_subscription(auth.uid())
);
