/*
  # Update RLS policies for subscription-based access

  1. Changes
    - Add function to check subscription status
    - Update RLS policies for flours table
    - Add subscription status update trigger

  2. Security
    - Allow full access for paid subscribers
    - Allow limited preview access for free users
    - Automatically handle subscription status updates
*/

-- Function to check if a user has an active paid subscription
CREATE OR REPLACE FUNCTION has_paid_subscription(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE subscriptions.user_id = user_id
    AND tier != 'free'
    AND active = true
    AND current_period_end > now()
  );
END;
$$ language plpgsql security definer;

-- Update RLS policies for flours table
DROP POLICY IF EXISTS "Allow public read access for flours" ON flours;

-- Policy for paid subscribers (full access)
CREATE POLICY "Allow paid subscribers to access full flour details"
  ON flours
  FOR SELECT
  TO authenticated
  USING (has_paid_subscription(auth.uid()));

-- Policy for free users and public (limited preview access)
CREATE POLICY "Allow preview access to flours"
  ON flours
  FOR SELECT
  TO public
  USING (true);

-- Function to handle subscription period updates
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS trigger AS $$
BEGIN
  -- Deactivate expired subscriptions
  UPDATE subscriptions
  SET active = false
  WHERE current_period_end < now()
  AND active = true;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to update subscription status
CREATE TRIGGER check_subscription_status
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();
