/*
  # Add user_id to blog_comments table

  1. Changes
    - Add user_id column to blog_comments table
    - Add foreign key constraint to users table
    - Add index for better query performance
    - Update RLS policies to use user_id

  2. Security
    - Ensure RLS policies are updated to use the new user_id column
    - Maintain existing security model
*/

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_comments' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE blog_comments 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
  END IF;
END $$;

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can create their own comments" ON blog_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON blog_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON blog_comments;

CREATE POLICY "Users can create their own comments"
ON blog_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON blog_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON blog_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
