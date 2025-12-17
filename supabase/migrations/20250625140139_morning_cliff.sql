/*
  # Add mix_bonus_purchases table for tracking additional mix slots

  1. New Table
    - `mix_bonus_purchases`: Track purchases of additional mix slots
    - Enable RLS with appropriate policies
    - Track purchase history and expiration

  2. Security
    - Users can only view their own purchases
    - Admin can manage all purchases
*/

-- Create mix_bonus_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS mix_bonus_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 5,
  amount_paid numeric(10,2) NOT NULL DEFAULT 4.00,
  purchase_date timestamptz DEFAULT now(),
  expiration_date timestamptz DEFAULT (now() + interval '1 year'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mix_bonus_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bonus purchases"
  ON mix_bonus_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all bonus purchases"
  ON mix_bonus_purchases
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

-- Create updated_at trigger
CREATE TRIGGER update_mix_bonus_purchases_updated_at
  BEFORE UPDATE ON mix_bonus_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_mix_bonus_purchases_user_id ON mix_bonus_purchases(user_id);
CREATE INDEX idx_mix_bonus_purchases_is_active ON mix_bonus_purchases(is_active);

-- Update the get_user_mix_limit function to include bonus slots
CREATE OR REPLACE FUNCTION get_user_mix_limit(user_uuid UUID)
RETURNS integer AS $$
DECLARE
  user_tier subscription_tier;
  tier_max_mixes integer;
  bonus_slots integer;
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
  
  -- Get bonus slots
  SELECT COALESCE(SUM(quantity), 0) INTO bonus_slots
  FROM mix_bonus_purchases
  WHERE user_id = user_uuid
    AND is_active = true
    AND expiration_date > now();
  
  -- Return base limit plus bonus slots
  RETURN tier_max_mixes + bonus_slots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the has_exceeded_mix_limit function to use the updated get_user_mix_limit
CREATE OR REPLACE FUNCTION has_exceeded_mix_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_mix_count integer;
  user_mix_limit integer;
BEGIN
  -- Get user's mix limit (including bonuses)
  user_mix_limit := get_user_mix_limit(user_uuid);
  
  -- Count user's mixes
  SELECT COUNT(*) INTO user_mix_count
  FROM saved_mixes
  WHERE user_id = user_uuid;
  
  -- Check if user has exceeded their limit
  RETURN user_mix_count >= user_mix_limit AND user_mix_limit > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
