/*
  # Fix ambiguous user_id reference in private_flours queries

  1. Changes
    - Update RLS policies to use proper table aliases
    - Fix ambiguous column references
    - Maintain existing security checks

  2. Security
    - Maintains enterprise subscription requirement
    - Keeps user-specific access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;

-- Create new policies with proper table aliases
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = private_flours.user_id 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = private_flours.user_id 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = private_flours.user_id 
  AND has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = private_flours.user_id 
  AND has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = private_flours.user_id 
  AND has_enterprise_subscription(auth.uid())
);
