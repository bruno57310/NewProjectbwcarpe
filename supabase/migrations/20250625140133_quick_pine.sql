/*
  # Add mix_limits table for subscription tiers

  1. New Table
    - `mix_limits`: Store mix limits for different subscription tiers
    - Enable RLS with admin-only write access
    - Public read access for all users

  2. Security
    - Only bruno_wendling@orange.fr can manage limits
    - All users can read limits
*/

-- Create mix_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS mix_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL UNIQUE,
  max_mixes integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mix_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage mix limits"
  ON mix_limits
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Public can read mix limits"
  ON mix_limits
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_mix_limits_updated_at
  BEFORE UPDATE ON mix_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default values
INSERT INTO mix_limits (tier, max_mixes)
VALUES 
  ('free', 0),
  ('pro', 1),
  ('enterprise', 20)
ON CONFLICT (tier) DO UPDATE
SET max_mixes = EXCLUDED.max_mixes;

-- Create function to check if a user has exceeded their mix limit
CREATE OR REPLACE FUNCTION has_exceeded_mix_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier subscription_tier;
  user_mix_count integer;
  tier_max_mixes integer;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO user_tier
  FROM subscriptions
  WHERE login_id = user_uuid
    AND active = true
    AND current_period_end > now()
  LIMIT 1;
  
  -- If no active subscription, default to free
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Get max mixes for this tier
  SELECT max_mixes INTO tier_max_mixes
  FROM mix_limits
  WHERE tier = user_tier;
  
  -- If no limit found, default to 0
  IF tier_max_mixes IS NULL THEN
    tier_max_mixes := 0;
  END IF;
  
  -- Count user's mixes
  SELECT COUNT(*) INTO user_mix_count
  FROM saved_mixes
  WHERE user_id = user_uuid;
  
  -- Check if user has exceeded their limit
  RETURN user_mix_count >= tier_max_mixes AND tier_max_mixes > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get a user's mix limit
CREATE OR REPLACE FUNCTION get_user_mix_limit(user_uuid UUID)
RETURNS integer AS $$
DECLARE
  user_tier subscription_tier;
  tier_max_mixes integer;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO user_tier
  FROM subscriptions
  WHERE login_id = user_uuid
    AND active = true
    AND current_period_end > now()
  LIMIT 1;
  
  -- If no active subscription, default to free
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Get max mixes for this tier
  SELECT max_mixes INTO tier_max_mixes
  FROM mix_limits
  WHERE tier = user_tier;
  
  -- If no limit found, default to 0
  IF tier_max_mixes IS NULL THEN
    tier_max_mixes := 0;
  END IF;
  
  RETURN tier_max_mixes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get a user's current mix count
CREATE OR REPLACE FUNCTION get_user_mix_count(user_uuid UUID)
RETURNS integer AS $$
DECLARE
  user_mix_count integer;
BEGIN
  -- Count user's mixes
  SELECT COUNT(*) INTO user_mix_count
  FROM saved_mixes
  WHERE user_id = user_uuid;
  
  RETURN user_mix_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
