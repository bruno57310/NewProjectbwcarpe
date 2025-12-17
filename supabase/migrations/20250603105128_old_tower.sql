/*
  # Fix blog_posts RLS policies

  1. Changes
    - Drop existing policies that might reference non-existent columns
    - Create new policies with correct column references
    - Use auth.email() instead of email() function
    - Maintain visibility level checks for different subscription tiers

  2. Security
    - Admin retains full control
    - Enterprise users can access all content
    - Pro users can access public and pro content
    - Public users can only access public content
*/

-- Drop existing policies to recreate them with correct column references
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Enterprise users can read all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Pro users can read pro blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Public can read published blog posts" ON blog_posts;

-- Recreate policies with correct column references
CREATE POLICY "Admin can manage all blog posts"
ON blog_posts
FOR ALL
TO authenticated
USING (auth.email() = 'bruno_wendling@orange.fr')
WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Enterprise users can read all blog posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (
  published = true AND (
    visibility_level IS NULL OR
    visibility_level = 'public' OR
    (visibility_level = 'pro' AND has_pro_subscription(auth.uid())) OR
    (visibility_level = 'enterprise' AND has_enterprise_subscription(auth.uid()))
  )
);

CREATE POLICY "Pro users can read pro blog posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (
  published = true AND (
    visibility_level IS NULL OR
    visibility_level = 'public' OR
    (visibility_level = 'pro' AND has_pro_subscription(auth.uid()))
  )
);

CREATE POLICY "Public can read published blog posts"
ON blog_posts
FOR SELECT
TO public
USING (
  published = true AND (
    visibility_level IS NULL OR
    visibility_level = 'public'
  )
);
