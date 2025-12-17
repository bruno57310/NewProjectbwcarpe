/*
  # Fix RLS policies for private_flours table

  1. Changes
    - Update RLS policies to use auth.uid() instead of uid()
    - Maintain enterprise subscription requirement
    - Ensure proper user_id_private_flours checks

  2. Security
    - Only enterprise subscribers can access
    - Users can only access their own private flours
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;

-- Create new policies with proper enterprise subscription checks
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id_private_flours 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id_private_flours 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id_private_flours 
  AND has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id_private_flours 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id_private_flours 
  AND has_enterprise_subscription(auth.uid())
);
