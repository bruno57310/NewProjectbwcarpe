-- First, rename the user_id columns to be more specific
ALTER TABLE private_flour_categories 
RENAME COLUMN user_id TO user_id_private_category;

ALTER TABLE private_flours 
RENAME COLUMN user_id TO user_id_private_flours;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can view their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can update their own private categories" ON private_flour_categories;
DROP POLICY IF EXISTS "Users can delete their own private categories" ON private_flour_categories;

-- Create RLS policies for private_flour_categories with explicit column names
CREATE POLICY "Users can create private categories"
ON private_flour_categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private categories"
ON private_flour_categories
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private categories"
ON private_flour_categories
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private categories"
ON private_flour_categories
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id_private_category AND 
  has_enterprise_subscription(auth.uid())
);

-- Drop existing policies for private_flours
DROP POLICY IF EXISTS "Users can create private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can view their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can update their own private flours" ON private_flours;
DROP POLICY IF EXISTS "Users can delete their own private flours" ON private_flours;

-- Create RLS policies for private_flours with explicit column names
CREATE POLICY "Users can create private flours"
ON private_flours
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id_private_flours AND 
  has_enterprise_subscription(auth.uid())
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

-- Update foreign key constraints
ALTER TABLE private_flour_categories
DROP CONSTRAINT IF EXISTS private_flour_categories_user_id_fkey,
ADD CONSTRAINT private_flour_categories_user_id_private_category_fkey 
FOREIGN KEY (user_id_private_category) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE private_flours
DROP CONSTRAINT IF EXISTS private_flours_user_id_fkey,
ADD CONSTRAINT private_flours_user_id_private_flours_fkey 
FOREIGN KEY (user_id_private_flours) REFERENCES auth.users(id) ON DELETE CASCADE;
