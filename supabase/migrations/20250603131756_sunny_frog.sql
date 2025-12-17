/*
  # Fix blog_posts RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies using auth.email() instead of email() function
    - Maintain same access control logic for different user types
    
  2. Security
    - Admin retains full control
    - Enterprise users can access all content
    - Pro users can access public and pro content
    - Public users can only access public content
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Enterprise users can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Pro users can read pro blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;

-- Recreate policies with correct function references
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
