/*
  # Fix subscription policies

  1. Changes
    - Add RLS policies for subscriptions table to allow:
      - Users to read their own subscription
      - Users to create their initial subscription
      - Users to update their own subscription
  
  2. Security
    - Enable RLS on subscriptions table (already enabled)
    - Add policies for authenticated users
*/

-- Allow users to read their own subscription
CREATE POLICY "Users can read own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create their initial subscription
CREATE POLICY "Users can create initial subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update their own subscription
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
