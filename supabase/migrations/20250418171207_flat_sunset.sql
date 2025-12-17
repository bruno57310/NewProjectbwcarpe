/*
  # Add text windows table for customizable content

  1. New Table
    - `text_windows`: Store customizable text windows for the landing page
    - Enable RLS with admin-only write access
    - Track window position, size, and content

  2. Security
    - Only bruno_wendling@orange.fr can manage text windows
    - Public read access for active windows
*/

-- Create text_windows table
CREATE TABLE IF NOT EXISTS text_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  position jsonb NOT NULL DEFAULT '{
    "x": 0,
    "y": 0,
    "width": "400px",
    "height": "auto",
    "zIndex": 10
  }'::jsonb,
  background_color text DEFAULT '#ffffff',
  text_color text DEFAULT '#000000',
  border_style jsonb DEFAULT '{
    "width": "1px",
    "style": "solid",
    "color": "#e5e7eb",
    "radius": "0.5rem"
  }'::jsonb,
  active boolean DEFAULT true,
  page text NOT NULL DEFAULT 'home',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text DEFAULT auth.email()
);

-- Enable RLS
ALTER TABLE text_windows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admin to manage text windows"
  ON text_windows
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Allow public to view active text windows"
  ON text_windows
  FOR SELECT
  TO public
  USING (active = true);

-- Create updated_at trigger
CREATE TRIGGER update_text_windows_updated_at
  BEFORE UPDATE ON text_windows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_text_windows_page ON text_windows(page);
CREATE INDEX idx_text_windows_active ON text_windows(active);
