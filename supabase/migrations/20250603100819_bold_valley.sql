/*
  # Fix Blog Post Visibility Levels for Pro and Enterprise Users

  1. Changes
    - Add RLS policies for Pro and Enterprise users to access appropriate blog posts
    - Maintain existing policy for public users
    - Ensure proper visibility level checks based on subscription tier

  2. Security
    - Pro users can see public and pro posts
    - Enterprise users can see all posts
    - Public users can only see public posts
*/

-- Drop existing policies to recreate them with proper visibility level checks
DROP POLICY IF EXISTS "Public can read published blog posts" ON blog_posts;

-- Create policy for public users (can only see public posts)
CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (
    published = true AND 
    (visibility_level IS NULL OR visibility_level = 'public')
  );

-- Create function to check if a user has a pro subscription
CREATE OR REPLACE FUNCTION has_pro_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = user_uuid
      AND (tier = 'pro' OR tier = 'enterprise')
      AND active = true
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy for pro users (can see public and pro posts)
CREATE POLICY "Pro users can read pro blog posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (
    published = true AND 
    (
      visibility_level IS NULL OR 
      visibility_level = 'public' OR 
      (visibility_level = 'pro' AND has_pro_subscription(auth.uid()))
    )
  );

-- Create policy for enterprise users (can see all posts)
CREATE POLICY "Enterprise users can read all blog posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (
    published = true AND 
    (
      visibility_level IS NULL OR 
      visibility_level = 'public' OR 
      (visibility_level = 'pro' AND has_pro_subscription(auth.uid())) OR
      (visibility_level = 'enterprise' AND has_enterprise_subscription(auth.uid()))
    )
  );

-- Update existing data to ensure all posts have a visibility level
UPDATE blog_posts
SET visibility_level = 'public'
WHERE visibility_level IS NULL;
