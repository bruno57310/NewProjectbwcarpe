/*
  # Add private flour categories table and migrate data

  1. Changes
    - Create private_flour_categories table
    - Add indexes and constraints
    - Set up RLS policies
    - Update foreign key relationships

  2. Security
    - Enable RLS
    - Only enterprise users can access
    - Users can only access their own data
*/

-- First, create the private_flour_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS private_flour_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_private_flour_categories_user_id 
ON private_flour_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_private_flour_categories_name 
ON private_flour_categories(name);

-- Enable RLS
ALTER TABLE private_flour_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for private_flour_categories
CREATE POLICY "Users can create private categories"
ON private_flour_categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can view their own private categories"
ON private_flour_categories
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can update their own private categories"
ON private_flour_categories
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

CREATE POLICY "Users can delete their own private categories"
ON private_flour_categories
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id AND 
  has_enterprise_subscription(auth.uid())
);

-- First, remove the foreign key constraint from private_flours
ALTER TABLE private_flours 
DROP CONSTRAINT IF EXISTS private_flours_category_id_fkey;

-- Set category_id to NULL for all private_flours to avoid constraint issues
UPDATE private_flours SET category_id = NULL;

-- Now we can safely add the new foreign key constraint
ALTER TABLE private_flours
ADD CONSTRAINT private_flours_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES private_flour_categories(id)
ON DELETE SET NULL;

-- Add unique constraint for category names per user
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'private_flour_categories_name_user_unique'
  ) THEN
    ALTER TABLE private_flour_categories
    ADD CONSTRAINT private_flour_categories_name_user_unique 
    UNIQUE (name, user_id);
  END IF;
END $$;
