/*
  # Fix Blog Tables and Policies

  1. Changes
    - Create blog_categories and blog_posts tables if they don't exist
    - Add proper indexes and constraints
    - Create RLS policies with conditional checks to avoid duplicates
    
  2. Security
    - Enable RLS on all tables
    - Add policies for different user types based on subscription level
    - Ensure admin has full access
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
  published_at timestamptz,
  access_level text DEFAULT 'public' CHECK (access_level IN ('public', 'pro', 'enterprise'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_access_level ON blog_posts(access_level);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog categories policies - check if they exist before creating
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_categories' 
    AND policyname = 'Public can read blog categories'
  ) THEN
    CREATE POLICY "Public can read blog categories"
      ON blog_categories
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_categories' 
    AND policyname = 'Admin can manage blog categories'
  ) THEN
    CREATE POLICY "Admin can manage blog categories"
      ON blog_categories
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');
  END IF;
END $$;

-- Blog posts policies - check if they exist before creating
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Public can read published blog posts'
  ) THEN
    CREATE POLICY "Public can read published blog posts"
      ON blog_posts
      FOR SELECT
      TO public
      USING (
        published = true 
        AND (access_level = 'public' OR access_level IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Pro users can read pro blog posts'
  ) THEN
    CREATE POLICY "Pro users can read pro blog posts"
      ON blog_posts
      FOR SELECT
      TO authenticated
      USING (
        published = true 
        AND (
          access_level = 'public' 
          OR (access_level = 'pro' AND has_pro_subscription(auth.uid()))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Enterprise users can read all blog posts'
  ) THEN
    CREATE POLICY "Enterprise users can read all blog posts"
      ON blog_posts
      FOR SELECT
      TO authenticated
      USING (
        published = true 
        AND (
          access_level = 'public'
          OR (access_level = 'pro' AND has_pro_subscription(auth.uid()))
          OR (access_level = 'enterprise' AND has_enterprise_subscription(auth.uid()))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_posts' 
    AND policyname = 'Admin can manage all blog posts'
  ) THEN
    CREATE POLICY "Admin can manage all blog posts"
      ON blog_posts
      FOR ALL
      TO authenticated
      USING (auth.email() = 'bruno_wendling@orange.fr')
      WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_blog_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_blog_categories_updated_at
      BEFORE UPDATE ON blog_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_blog_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_blog_posts_updated_at
      BEFORE UPDATE ON blog_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
