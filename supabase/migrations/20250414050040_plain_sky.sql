/*
  # Fix enterprise subscription check function

  1. Changes
    - Drop existing function before recreating
    - Use consistent parameter naming
    - Update RLS policies to use the function

  2. Security
    - Maintain security definer setting
    - Keep same subscription validation logic
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.has_enterprise_subscription(uuid);

-- Create the function with consistent parameter naming
CREATE OR REPLACE FUNCTION public.has_enterprise_subscription(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE subscriptions.user_id = user_id
      AND subscriptions.tier = 'enterprise'
      AND subscriptions.active = true
      AND subscriptions.current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
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
