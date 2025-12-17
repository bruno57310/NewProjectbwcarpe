/*
  # Add Banners Management System

  1. New Table
    - `banners`: Store banner information and placement
    - Enable RLS with admin-only access
    - Track banner visibility and placement

  2. Security
    - Only bruno_wendling@orange.fr can manage banners
    - Public read access for active banners
*/

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  image_url text,
  link_url text,
  placement text NOT NULL,
  active boolean DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admin to manage banners"
  ON banners
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Allow public to view active banners"
  ON banners
  FOR SELECT
  TO public
  USING (
    active = true 
    AND (start_date IS NULL OR start_date <= now()) 
    AND (end_date IS NULL OR end_date >= now())
  );

-- Create updated_at trigger
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_banners_placement ON banners(placement);
CREATE INDEX idx_banners_active_dates ON banners(active, start_date, end_date);
