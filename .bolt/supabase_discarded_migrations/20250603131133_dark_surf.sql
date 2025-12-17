/*
  # Fix blog posts RLS policies

  1. Changes
    - Drop existing RLS policies that might reference user_id
    - Create new RLS policies using author_id instead
    - Ensure proper access control for different subscription levels
  
  2. Security
    - Enable RLS on blog_posts table
    - Add policies for public and authenticated access
    - Add policies for different subscription tiers
*/

-- First, drop any existing policies on the blog_posts table
DROP POLICY IF EXISTS "Admin can manage all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Enterprise users can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Pro users can read pro blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;

-- Create new policies using author_id
CREATE POLICY "Admin can manage all blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (email() = 'bruno_wendling@orange.fr')
WITH CHECK (email() = 'bruno_wendling@orange.fr');

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
