/*
  # Create blog_comments table

  1. New Table
    - `blog_comments`: Store comments on blog posts
    - Add foreign key relationships to blog_posts and profiles
    - Add appropriate indexes for performance
    
  2. Security
    - Enable RLS
    - Add policies for comment creation, reading, updating, and deletion
    - Ensure proper access control
*/

-- Create blog_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Policy for creating comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_comments' 
    AND policyname = 'Création de commentaires pour utilisateurs authentifiés'
  ) THEN
    CREATE POLICY "Création de commentaires pour utilisateurs authentifiés"
      ON blog_comments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for reading comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_comments' 
    AND policyname = 'Lecture publique des commentaires'
  ) THEN
    CREATE POLICY "Lecture publique des commentaires"
      ON blog_comments
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Policy for updating comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_comments' 
    AND policyname = 'Modification des commentaires par leurs auteurs'
  ) THEN
    CREATE POLICY "Modification des commentaires par leurs auteurs"
      ON blog_comments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policy for deleting comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_comments' 
    AND policyname = 'Suppression des commentaires par leurs auteurs'
  ) THEN
    CREATE POLICY "Suppression des commentaires par leurs auteurs"
      ON blog_comments
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for admin to manage all comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_comments' 
    AND policyname = 'Admin peut gérer tous les commentaires'
  ) THEN
    CREATE POLICY "Admin peut gérer tous les commentaires"
      ON blog_comments
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(approved);

-- Create updated_at trigger
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_blog_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_blog_comments_updated_at
      BEFORE UPDATE ON blog_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add constraint for rating if needed
ALTER TABLE blog_comments
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
