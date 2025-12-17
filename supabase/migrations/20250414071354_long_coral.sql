/*
  # Add private flour categories table and migrate data

  1. Changes
    - Create private_flour_categories table
    - Migrate existing category data
    - Update foreign key constraints
    - Add RLS policies

  2. Security
    - Enable RLS
    - Only enterprise users can access
    - Users can only access their own data
*/

-- First, create the private_flour_categories table
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

-- Add unique constraint for category names per user
ALTER TABLE private_flour_categories
ADD CONSTRAINT private_flour_categories_name_user_unique 
UNIQUE (name, user_id);

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

-- Create temporary table to store category mappings
CREATE TEMP TABLE category_mapping (
  old_id uuid,
  new_id uuid,
  user_id uuid
);

-- Migrate existing categories and store mappings
DO $$ 
DECLARE 
  flour_record RECORD;
  new_category_id uuid;
BEGIN
  FOR flour_record IN 
    SELECT DISTINCT 
      pf.user_id,
      pf.category_id as old_category_id,
      fc.name,
      fc.description
    FROM private_flours pf
    JOIN flour_categories fc ON fc.id = pf.category_id
  LOOP
    -- Insert into private_flour_categories and get new ID
    INSERT INTO private_flour_categories (
      user_id,
      name,
      description
    ) VALUES (
      flour_record.user_id,
      flour_record.name,
      flour_record.description
    )
    RETURNING id INTO new_category_id;

    -- Store mapping
    INSERT INTO category_mapping (old_id, new_id, user_id)
    VALUES (flour_record.old_category_id, new_category_id, flour_record.user_id);
  END LOOP;
END $$;

-- Update private_flours with new category IDs
UPDATE private_flours pf
SET category_id = cm.new_id
FROM category_mapping cm
WHERE pf.category_id = cm.old_id
  AND pf.user_id = cm.user_id;

-- Drop temporary table
DROP TABLE category_mapping;

-- Now we can safely add the new foreign key constraint
ALTER TABLE private_flours
ADD CONSTRAINT private_flours_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES private_flour_categories(id)
ON DELETE SET NULL;
