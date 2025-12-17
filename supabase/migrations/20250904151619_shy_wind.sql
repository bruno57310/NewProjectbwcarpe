/*
  # Update RLS policies for Enterprise contribution tables

  1. Changes
    - Update contributionanti_nutrients table policies to allow Pro users read access
    - Update contributionenzymes table policies to allow Pro users read access
    - Maintain admin full access
    - Keep existing security for other operations

  2. Security
    - Pro and Enterprise users can read contribution data
    - Only admin can modify contribution data
    - Maintains data integrity
*/

-- Update RLS policies for contributionanti_nutrients table
DROP POLICY IF EXISTS "Users can view contributions" ON contributionanti_nutrients;

CREATE POLICY "Pro and Enterprise users can view contributions"
  ON contributionanti_nutrients
  FOR SELECT
  TO authenticated
  USING (
    has_pro_subscription(auth.uid()) OR 
    has_enterprise_subscription(auth.uid())
  );

-- Update RLS policies for contributionenzymes table
DROP POLICY IF EXISTS "Users can view contributions" ON contributionenzymes;

CREATE POLICY "Pro and Enterprise users can view contributions"
  ON contributionenzymes
  FOR SELECT
  TO authenticated
  USING (
    has_pro_subscription(auth.uid()) OR 
    has_enterprise_subscription(auth.uid())
  );

-- Ensure the has_pro_subscription function exists and is correct
CREATE OR REPLACE FUNCTION has_pro_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE login_id = user_uuid
      AND (tier = 'pro' OR tier = 'enterprise')
      AND active = true
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the has_enterprise_subscription function exists and is correct
CREATE OR REPLACE FUNCTION has_enterprise_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE login_id = user_uuid
      AND tier = 'enterprise'
      AND active = true
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
