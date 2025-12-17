/*
  # Add clickable_image_windows table

  1. New Table
    - `clickable_image_windows`: Store clickable image windows for the landing page
    - Enable RLS with admin-only write access
    - Track window visibility and placement

  2. Security
    - Only bruno_wendling@orange.fr can manage image windows
    - Public read access for active windows
*/

-- Create clickable_image_windows table
CREATE TABLE IF NOT EXISTS clickable_image_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text NOT NULL,
  position jsonb NOT NULL DEFAULT '{
    "x": 0,
    "y": 0,
    "width": "400px",
    "height": "300px",
    "zIndex": 10
  }'::jsonb,
  active boolean DEFAULT true,
  page text NOT NULL DEFAULT 'home',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text DEFAULT auth.email()
);

-- Enable RLS
ALTER TABLE clickable_image_windows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admin to manage clickable image windows"
  ON clickable_image_windows
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Allow public to view active clickable image windows"
  ON clickable_image_windows
  FOR SELECT
  TO public
  USING (active = true);

-- Create updated_at trigger
CREATE TRIGGER update_clickable_image_windows_updated_at
  BEFORE UPDATE ON clickable_image_windows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_clickable_image_windows_page ON clickable_image_windows(page);
CREATE INDEX idx_clickable_image_windows_active ON clickable_image_windows(active);
