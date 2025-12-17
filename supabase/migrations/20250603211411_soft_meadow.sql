/*
  # Add blog_likes table

  1. New Table
    - `blog_likes`: Store user likes for blog posts
    - Enable RLS with appropriate policies
    - Add necessary indexes and constraints

  2. Security
    - Users can only manage their own likes
    - Public read access for all likes
    - Admin can manage all likes
*/

-- Create blog_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Policy for users to manage their own likes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_likes' 
    AND policyname = 'Users can manage their own likes'
  ) THEN
    CREATE POLICY "Users can manage their own likes"
      ON blog_likes
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for public to read likes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_likes' 
    AND policyname = 'Public can read blog likes'
  ) THEN
    CREATE POLICY "Public can read blog likes"
      ON blog_likes
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Policy for admin to manage all likes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_likes' 
    AND policyname = 'Admin can manage all likes'
  ) THEN
    CREATE POLICY "Admin can manage all likes"
      ON blog_likes
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON blog_likes(user_id);
