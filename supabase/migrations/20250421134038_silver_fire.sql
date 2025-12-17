/*
  # Add Blog Tables

  1. New Tables
    - `blog_posts`: Store blog posts with content, author, and metadata
    - `blog_comments`: Store comments on blog posts
    - `blog_categories`: Store blog categories
    
  2. Security
    - Enable RLS
    - Admin can manage all posts
    - Authenticated users can comment
    - Public can read posts and comments
*/

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  image_url text,
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Create blog_comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_likes table
CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_categories
CREATE POLICY "Admin can manage blog categories"
  ON blog_categories
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Public can read blog categories"
  ON blog_categories
  FOR SELECT
  TO public
  USING (true);

-- Create RLS policies for blog_posts
CREATE POLICY "Admin can manage all blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (published = true);

-- Create RLS policies for blog_comments
CREATE POLICY "Admin can manage all blog comments"
  ON blog_comments
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Authenticated users can create comments"
  ON blog_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON blog_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON blog_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read approved blog comments"
  ON blog_comments
  FOR SELECT
  TO public
  USING (approved = true);

-- Create RLS policies for blog_likes
CREATE POLICY "Users can manage their own likes"
  ON blog_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read blog likes"
  ON blog_likes
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

CREATE INDEX idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_approved ON blog_comments(approved);

CREATE INDEX idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX idx_blog_likes_user_id ON blog_likes(user_id);

-- Insert default categories
INSERT INTO blog_categories (name, slug, description)
VALUES 
  ('L''appât parfait', 'perfect-bait', 'Articles sur la conception d''appâts parfaits pour la pêche à la carpe'),
  ('Conception d''un mix', 'mix-design', 'Guides et conseils pour créer des mélanges optimaux'),
  ('Calculateur', 'calculator', 'Tutoriels et astuces pour utiliser le calculateur de mix'),
  ('Abonnements', 'subscriptions', 'Informations sur les différents plans d''abonnement')
ON CONFLICT (name) DO NOTHING;
