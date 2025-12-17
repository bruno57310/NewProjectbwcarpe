/*
  # Create test table

  1. Changes
    - Add test table with basic fields
    - Add primary key constraint
    - Set default values for timestamps
*/

-- Create test table
CREATE TABLE IF NOT EXISTS public.test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to test"
  ON public.test
  FOR SELECT
  TO public
  USING (true);
