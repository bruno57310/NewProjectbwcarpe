/*
  # Update private_flours RLS policies

  1. Changes
    - Update RLS policies for private_flours table to properly handle enterprise users
    - Ensure policies check for both user ownership and enterprise subscription
    - Fix policy definitions to match table structure

  2. Security
    - Maintain strict access control based on user ownership
    - Verify enterprise subscription status for all operations
    - Ensure consistent policy naming and structure
*/

-- Drop existing policies to recreate them with correct conditions
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;

-- Create new policies with correct conditions
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id_private_flours) AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id_private_flours) AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id_private_flours) AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  (auth.uid() = user_id_private_flours) AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id_private_flours) AND 
  has_enterprise_subscription(auth.uid())
);
