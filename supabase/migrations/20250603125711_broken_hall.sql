/*
  # Fix Blog Posts RLS Policies

  1. Changes
    - Drop existing policies that might reference non-existent columns
    - Create new policies with correct function references
    - Use auth.email() instead of email() function
    - Maintain visibility level checks for different subscription tiers

  2. Security
    - Admin retains full control
    - Enterprise users can access all content
    - Pro users can access public and pro content
    - Public users can only access public content
*/

-- First, drop any existing policies on the blog_posts table
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Enterprise users can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Pro users can read pro blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;

-- Create new policies using author_id and auth.email()
CREATE POLICY "Admin can manage all blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (auth.email() = 'bruno_wendling@orange.fr')
WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Enterprise users can read all blog posts"
ON public.blog_posts
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
ON public.blog_posts
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
ON public.blog_posts
FOR SELECT
TO public
USING (
  published = true AND (
    visibility_level IS NULL OR
    visibility_level = 'public'
  )
);
