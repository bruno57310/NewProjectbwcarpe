/*
  # Add origine_content table

  1. New Table
    - `origine_content`: Store content for the origin page
    - Enable RLS with admin-only write access
    - Public read access

  2. Security
    - Only bruno_wendling@orange.fr can manage content
    - Public read access for all users
*/

-- Create origine_content table
CREATE TABLE IF NOT EXISTS origine_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE origine_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admin to manage origine content"
  ON origine_content
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

CREATE POLICY "Allow public to view origine content"
  ON origine_content
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_origine_content_updated_at
  BEFORE UPDATE ON origine_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
