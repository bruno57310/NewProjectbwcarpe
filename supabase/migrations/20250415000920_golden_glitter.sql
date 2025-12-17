/*
  # Create test table with public access

  1. Changes
    - Add test table with basic fields
    - Add primary key constraint
    - Enable RLS
    - Add public read and write policies

  2. Security
    - Allow public read access to all rows
    - Allow public write access to all rows
    - Enable RLS for policy enforcement
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

-- Create policy for public insert access
CREATE POLICY "Allow public insert access to test"
  ON public.test
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Allow public update access to test"
  ON public.test
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policy for public delete access
CREATE POLICY "Allow public delete access to test"
  ON public.test
  FOR DELETE
  TO public
  USING (true);
