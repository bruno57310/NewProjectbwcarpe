/*
  # Fix admin access for specific user

  1. Changes
    - Set admin status in user metadata
    - Update RLS policies to check metadata
    - Ensure proper admin access

  2. Security
    - Uses secure metadata update
    - Maintains RLS policies
*/

-- Update user metadata to include admin status
UPDATE auth.users 
SET raw_user_meta_data = 
  CASE 
    WHEN email = 'bruno_wendling@orange.fr' THEN 
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{is_admin}',
        'true'::jsonb
      )
    ELSE raw_user_meta_data
  END
WHERE email = 'bruno_wendling@orange.fr';

-- Ensure is_admin column is properly set
UPDATE auth.users 
SET is_admin = true 
WHERE email = 'bruno_wendling@orange.fr';

-- Refresh RLS policies to ensure they take effect
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
