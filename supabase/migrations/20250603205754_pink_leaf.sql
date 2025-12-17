/*
  # Fix blog_posts author_id foreign key constraint

  1. Changes
    - Update the foreign key constraint for blog_posts.author_id to reference profiles.id
    - Drop the existing constraint that references auth.users
    - Add a new constraint that references profiles table
    - Maintain ON DELETE SET NULL behavior

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- First, drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'blog_posts_author_id_fkey'
    AND table_name = 'blog_posts'
  ) THEN
    ALTER TABLE blog_posts DROP CONSTRAINT blog_posts_author_id_fkey;
  END IF;
END $$;

-- Add the new foreign key constraint referencing profiles.id
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Ensure profiles table has display_name populated
UPDATE profiles
SET display_name = email
WHERE display_name IS NULL AND email IS NOT NULL;
