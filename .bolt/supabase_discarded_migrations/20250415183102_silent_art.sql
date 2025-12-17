-- Rename user_id to login_id in subscriptions table
ALTER TABLE subscriptions
RENAME COLUMN user_id TO login_id;

-- Drop existing foreign key constraint
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Add new foreign key constraint
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_login_id_fkey
FOREIGN KEY (login_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing unique constraint
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

-- Add new unique constraint
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_login_id_key UNIQUE (login_id);

-- Drop existing index
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_user_id_active;

-- Create new indexes
CREATE INDEX idx_subscriptions_login_id ON subscriptions(login_id);
CREATE INDEX idx_subscriptions_login_id_active ON subscriptions(login_id, active);

-- Update function to use login_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (login_id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Update function to check subscription status
CREATE OR REPLACE FUNCTION has_enterprise_subscription(user_uuid UUID)
RETURNS boolean AS $$
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
$$ language plpgsql security definer;
