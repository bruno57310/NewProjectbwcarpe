-- Add visibility_level column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'blog_posts' 
    AND column_name = 'visibility_level'
  ) THEN
    -- Add the column with a default value of 'public'
    ALTER TABLE blog_posts 
    ADD COLUMN visibility_level text DEFAULT 'public';
    
    -- Add check constraint to ensure valid values
    ALTER TABLE blog_posts 
    ADD CONSTRAINT blog_posts_visibility_level_check 
    CHECK (visibility_level IN ('public', 'pro', 'enterprise'));
  END IF;
END $$;

-- Update existing RLS policies to respect visibility levels
DROP POLICY IF EXISTS "Public can read published blog posts" ON blog_posts;

-- Create new policy that respects visibility levels
CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (
    published = true AND 
    (visibility_level IS NULL OR visibility_level = 'public')
  );
