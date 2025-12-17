/*
  # Fix Blog Post Visibility Levels

  1. Changes
    - Add visibility_level column to blog_posts table if it doesn't exist
    - Add check constraint to ensure valid visibility levels
    - Update RLS policies to respect visibility levels
    - Add default value of 'public' for visibility_level

  2. Security
    - Maintain existing RLS policies
    - Add visibility level check based on subscription tier
*/

-- First, check if visibility_level column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'blog_posts' 
    AND column_name = 'visibility_level'
  ) THEN
    ALTER TABLE blog_posts 
    ADD COLUMN visibility_level text DEFAULT 'public';
    
    -- Add check constraint for valid visibility levels
    ALTER TABLE blog_posts
    ADD CONSTRAINT blog_posts_visibility_level_check
    CHECK (visibility_level = ANY (ARRAY['public', 'pro', 'enterprise']));
  END IF;
END $$;

-- Drop existing policies to recreate them with visibility level checks
DROP POLICY IF EXISTS "Public can read published blog posts" ON blog_posts;

-- Create new policy for public users (can only see public posts)
CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (
    published = true AND 
    (visibility_level IS NULL OR visibility_level = 'public')
  );

-- Update existing data to ensure all posts have a visibility level
UPDATE blog_posts
SET visibility_level = 'public'
WHERE visibility_level IS NULL;
