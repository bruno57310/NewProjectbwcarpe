-- Migration to fix subscription defaults
ALTER TABLE subscriptions
ALTER COLUMN tier SET DEFAULT 'free',
ALTER COLUMN active SET DEFAULT true;

-- Backfill missing records
INSERT INTO subscriptions (login_id, tier, active)
SELECT id, 'free', true FROM auth.users
WHERE id NOT IN (SELECT login_id FROM subscriptions)
ON CONFLICT (login_id) DO NOTHING;
