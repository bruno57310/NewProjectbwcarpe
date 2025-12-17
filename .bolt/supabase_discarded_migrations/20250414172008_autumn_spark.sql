-- Refresh the relationship by dropping and recreating the foreign key
ALTER TABLE public.private_flours 
DROP CONSTRAINT IF EXISTS private_flours_category_id_fkey;

-- Recreate the foreign key with explicit schema references
ALTER TABLE public.private_flours
ADD CONSTRAINT private_flours_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.private_flour_categories(id)
ON DELETE SET NULL;

-- Analyze tables to update statistics and refresh schema cache
ANALYZE public.private_flours;
ANALYZE public.private_flour_categories;
