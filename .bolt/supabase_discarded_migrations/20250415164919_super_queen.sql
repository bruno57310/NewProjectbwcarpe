/*
  # Add has_enterprise_subscription function

  1. Changes
    - Create function to check if a user has an active enterprise subscription
    - Function returns boolean based on subscription status
    - Checks for active enterprise tier and valid period

  2. Security
    - Uses SECURITY DEFINER to run with creator's privileges
    - Properly checks subscription status and expiration
*/

-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.has_enterprise_subscription(uuid);

-- Create the function
CREATE OR REPLACE FUNCTION public.has_enterprise_subscription(user_uuid UUID)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_enterprise_subscription(UUID) TO authenticated;
