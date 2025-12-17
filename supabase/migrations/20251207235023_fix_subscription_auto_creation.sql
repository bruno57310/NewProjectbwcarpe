/*
  # Fix automatic subscription creation for new users

  1. Changes
    - Update handle_new_user() function to create both profile AND subscription
    - Use correct column name (login_id instead of user_id)
    - Ensure new users get a free subscription by default

  2. Notes
    - This fixes the issue where new users were only getting profiles
    - but no subscription records were being created
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create updated function to handle both profile and subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default subscription
  INSERT INTO public.subscriptions (login_id, tier, active)
  VALUES (NEW.id, 'free', true)
  ON CONFLICT (login_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create subscriptions for existing users who don't have one
INSERT INTO subscriptions (login_id, tier, active)
SELECT u.id, 'free', true
FROM auth.users u
LEFT JOIN subscriptions s ON s.login_id = u.id
WHERE s.id IS NULL
ON CONFLICT (login_id) DO NOTHING;
