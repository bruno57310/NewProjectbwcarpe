-- Add normalized email column and search function
ALTER TABLE profiles
ADD COLUMN normalized_email text GENERATED ALWAYS AS (
  lower(regexp_replace(email, '[^a-z0-9@]', '', 'g'))
) STORED;

CREATE OR REPLACE FUNCTION find_profile_by_email(search_email text)
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM profiles
  WHERE 
    normalized_email ILIKE '%' || replace(search_email, '.', '') || '%'
    OR normalized_email ILIKE '%' || split_part(search_email, '@', 1) || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
