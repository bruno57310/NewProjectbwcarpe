-- Create debug_rls_policies function
CREATE OR REPLACE FUNCTION public.debug_rls_policies(table_name text)
RETURNS TABLE (
  policy_name text,
  cmd text,
  permissive text,
  roles text[],
  using_expression text,
  check_expression text
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    p.policyname::text AS policy_name,
    p.cmd::text,
    p.permissive::text,
    p.roles::text[],
    pg_get_expr(p.qual, p.relid) AS using_expression,
    pg_get_expr(p.with_check, p.relid) AS check_expression
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.relid
  WHERE c.relname = table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- Grant execute permissions
REVOKE ALL ON FUNCTION public.debug_rls_policies FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debug_rls_policies TO authenticated;

COMMENT ON FUNCTION public.debug_rls_policies IS 'Debug RLS policies for a given table';
