/*
  # Add Database Functions for Flour Category Management

  1. New Functions
    - `list_private_flour_users`: List users who have private flours
    - `get_communes_public_and_enterprise`: Get common flours between public and enterprise catalogs
    - `get_public_noexistin_enterprise`: Get public flours not in enterprise catalog
    - `get_enterprise_noexistin_public`: Get enterprise flours not in public catalog
    - `get_communes_private_and_enterprise_fromenterprise`: Get common flours between private and enterprise (from enterprise perspective)
    - `get_communes_private_and_enterprise_fromprivate`: Get common flours between private and enterprise (from private perspective)
    - `get_private_noexistin_enterprise`: Get private flours not in enterprise catalog
    - `get_enterprise_noexistin_private`: Get enterprise flours not in private catalog
    - `compare_public_enterprise`: Compare public and enterprise catalogs
    - `compare_private_enterprise`: Compare private and enterprise catalogs for a specific user

  2. Security
    - Grant execute permissions to anon, authenticated, and service_role
*/

-- Function to list users who have private flours
CREATE OR REPLACE FUNCTION public.list_private_flour_users()
RETURNS TABLE (
  id uuid,
  email text
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT
    pr.id,
    pr.email
  FROM public.profiles pr
  INNER JOIN public.private_flours pfs
    ON pfs.user_id_private_flours = pr.id
  ORDER BY pr.email ASC;
$$;

-- Function to get common flours between public and enterprise catalogs
CREATE OR REPLACE FUNCTION public.get_communes_public_and_enterprise()
RETURNS TABLE (
  name text,
  public_id uuid,
  enterprise_id uuid,
  category_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    f.name,
    f.id as public_id,
    ft.id as enterprise_id,
    fc.name as category_name
  FROM public.flours f
  INNER JOIN public.flours_template ft ON f.name = ft.name
  LEFT JOIN public.flour_categories fc ON f.category_id = fc.id
  ORDER BY f.name;
$$;

-- Function to get public flours not existing in enterprise catalog
CREATE OR REPLACE FUNCTION public.get_public_noexistin_enterprise()
RETURNS TABLE (
  name text,
  id uuid,
  category_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    f.name,
    f.id,
    fc.name as category_name,
    f.created_at
  FROM public.flours f
  LEFT JOIN public.flour_categories fc ON f.category_id = fc.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.flours_template ft 
    WHERE ft.name = f.name
  )
  ORDER BY f.name;
$$;

-- Function to get enterprise flours not existing in public catalog
CREATE OR REPLACE FUNCTION public.get_enterprise_noexistin_public()
RETURNS TABLE (
  name text,
  id uuid,
  category_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ft.name,
    ft.id,
    fc.name as category_name,
    ft.created_at
  FROM public.flours_template ft
  LEFT JOIN public.flour_categories fc ON ft.category_id = fc.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.flours f 
    WHERE f.name = ft.name
  )
  ORDER BY ft.name;
$$;

-- Function to get common flours between private and enterprise (from enterprise perspective)
CREATE OR REPLACE FUNCTION public.get_communes_private_and_enterprise_fromenterprise()
RETURNS TABLE (
  name text,
  enterprise_id uuid,
  private_id uuid,
  user_email text,
  category_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ft.name,
    ft.id as enterprise_id,
    pf.id as private_id,
    pr.email as user_email,
    fc.name as category_name
  FROM public.flours_template ft
  INNER JOIN public.private_flours pf ON ft.name = pf.name
  LEFT JOIN public.profiles pr ON pf.user_id_private_flours = pr.id
  LEFT JOIN public.flour_categories fc ON ft.category_id = fc.id
  ORDER BY ft.name, pr.email;
$$;

-- Function to get common flours between private and enterprise (from private perspective)
CREATE OR REPLACE FUNCTION public.get_communes_private_and_enterprise_fromprivate()
RETURNS TABLE (
  name text,
  private_id uuid,
  enterprise_id uuid,
  user_email text,
  category_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pf.name,
    pf.id as private_id,
    ft.id as enterprise_id,
    pr.email as user_email,
    pfc.name as category_name
  FROM public.private_flours pf
  INNER JOIN public.flours_template ft ON pf.name = ft.name
  LEFT JOIN public.profiles pr ON pf.user_id_private_flours = pr.id
  LEFT JOIN public.private_flour_categories pfc ON pf.private_flour_categories_id = pfc.id
  ORDER BY pf.name, pr.email;
$$;

-- Function to get private flours not existing in enterprise catalog
CREATE OR REPLACE FUNCTION public.get_private_noexistin_enterprise()
RETURNS TABLE (
  name text,
  id uuid,
  user_email text,
  category_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pf.name,
    pf.id,
    pr.email as user_email,
    pfc.name as category_name,
    pf.created_at
  FROM public.private_flours pf
  LEFT JOIN public.profiles pr ON pf.user_id_private_flours = pr.id
  LEFT JOIN public.private_flour_categories pfc ON pf.private_flour_categories_id = pfc.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.flours_template ft 
    WHERE ft.name = pf.name
  )
  ORDER BY pf.name, pr.email;
$$;

-- Function to get enterprise flours not existing in private catalog
CREATE OR REPLACE FUNCTION public.get_enterprise_noexistin_private()
RETURNS TABLE (
  name text,
  id uuid,
  category_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ft.name,
    ft.id,
    fc.name as category_name,
    ft.created_at
  FROM public.flours_template ft
  LEFT JOIN public.flour_categories fc ON ft.category_id = fc.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.private_flours pf 
    WHERE pf.name = ft.name
  )
  ORDER BY ft.name;
$$;

-- Function to compare public and enterprise catalogs
CREATE OR REPLACE FUNCTION public.compare_public_enterprise()
RETURNS TABLE (
  name text,
  in_public boolean,
  in_enterprise boolean,
  public_id uuid,
  enterprise_id uuid,
  category_name text
)
LANGUAGE sql
STABLE
AS $$
  WITH all_flours AS (
    SELECT name FROM public.flours
    UNION
    SELECT name FROM public.flours_template
  )
  SELECT 
    af.name,
    (f.id IS NOT NULL) as in_public,
    (ft.id IS NOT NULL) as in_enterprise,
    f.id as public_id,
    ft.id as enterprise_id,
    COALESCE(fc1.name, fc2.name) as category_name
  FROM all_flours af
  LEFT JOIN public.flours f ON af.name = f.name
  LEFT JOIN public.flours_template ft ON af.name = ft.name
  LEFT JOIN public.flour_categories fc1 ON f.category_id = fc1.id
  LEFT JOIN public.flour_categories fc2 ON ft.category_id = fc2.id
  ORDER BY af.name;
$$;

-- Function to compare private and enterprise catalogs for a specific user
CREATE OR REPLACE FUNCTION public.compare_private_enterprise(user_uuid uuid)
RETURNS TABLE (
  name text,
  in_private boolean,
  in_enterprise boolean,
  private_id uuid,
  enterprise_id uuid,
  user_email text,
  private_category text,
  enterprise_category text
)
LANGUAGE sql
STABLE
AS $$
  WITH user_flours AS (
    SELECT name FROM public.private_flours WHERE user_id_private_flours = user_uuid
    UNION
    SELECT name FROM public.flours_template
  )
  SELECT 
    uf.name,
    (pf.id IS NOT NULL) as in_private,
    (ft.id IS NOT NULL) as in_enterprise,
    pf.id as private_id,
    ft.id as enterprise_id,
    pr.email as user_email,
    pfc.name as private_category,
    fc.name as enterprise_category
  FROM user_flours uf
  LEFT JOIN public.private_flours pf ON uf.name = pf.name AND pf.user_id_private_flours = user_uuid
  LEFT JOIN public.flours_template ft ON uf.name = ft.name
  LEFT JOIN public.profiles pr ON pf.user_id_private_flours = pr.id
  LEFT JOIN public.private_flour_categories pfc ON pf.private_flour_categories_id = pfc.id
  LEFT JOIN public.flour_categories fc ON ft.category_id = fc.id
  ORDER BY uf.name;
$$;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION public.list_private_flour_users() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_communes_public_and_enterprise() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_noexistin_enterprise() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_enterprise_noexistin_public() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_communes_private_and_enterprise_fromenterprise() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_communes_private_and_enterprise_fromprivate() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_private_noexistin_enterprise() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_enterprise_noexistin_private() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compare_public_enterprise() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compare_private_enterprise(uuid) TO anon, authenticated, service_role;
