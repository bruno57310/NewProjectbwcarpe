/*
  # Fix private flours RLS policies

  1. Changes
    - Update RLS policies for private_flours table to properly handle enterprise subscription checks
    - Add explicit error messages for better debugging
    - Ensure policies are properly scoped to user ownership

  2. Security
    - Maintain enterprise-only access requirement
    - Keep user data isolation
    - Add better error handling
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;

-- Create new policies with better error handling
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN NOT (auth.uid() = user_id_private_flours) THEN
      false
    WHEN NOT has_enterprise_subscription(auth.uid()) THEN
      false
    ELSE
      true
  END
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
);
