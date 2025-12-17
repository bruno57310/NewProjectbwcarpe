/*
  # Restore login_id column in subscriptions table

  1. Changes
    - Rename user_id column back to login_id in subscriptions table
    - Update foreign key constraint to use login_id
    - Update RLS policies to use login_id

  2. Security
    - Maintain existing RLS policies with corrected column reference
*/

-- Rename the column back to login_id
ALTER TABLE subscriptions 
RENAME COLUMN user_id TO login_id;

-- Drop and recreate the foreign key with the correct column name
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_login_id_fkey 
FOREIGN KEY (login_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Update RLS policies to use login_id
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = login_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = login_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = login_id)
  WITH CHECK (auth.uid() = login_id);
