-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can view their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can update their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can delete their own private categories" ON private_flour_categories;

DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;

-- Create RLS policies for private_flour_categories with fully qualified table names
CREATE POLICY "Users can create private categories"
ON private_flour_categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = private_flour_categories.user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private categories"
ON private_flour_categories
FOR SELECT
TO authenticated
USING (
  auth.uid() = private_flour_categories.user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private categories"
ON private_flour_categories
FOR UPDATE
TO authenticated
USING (
  auth.uid() = private_flour_categories.user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = private_flour_categories.user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private categories"
ON private_flour_categories
FOR DELETE
TO authenticated
USING (
  auth.uid() = private_flour_categories.user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

-- Create RLS policies for private_flours with fully qualified table names
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = private_flours.user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private flours"
ON private_flours
FOR SELECT
TO authenticated
USING (
  auth.uid() = private_flours.user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private flours"
ON private_flours
FOR UPDATE
TO authenticated
USING (
  auth.uid() = private_flours.user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = private_flours.user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private flours"
ON private_flours
FOR DELETE
TO authenticated
USING (
  auth.uid() = private_flours.user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
);
