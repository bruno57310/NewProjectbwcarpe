/*
  # Create saved_mixes_shared table

  1. New Table
    - `saved_mixes_shared`: Store shared mixes that can be viewed by all users
    - Similar structure to saved_mixes but with sharing capabilities
    - Enable RLS with appropriate policies

  2. Security
    - Users can view all shared mixes
    - Only mix owners can share their mixes
    - Admin can manage all shared mixes
*/

-- Create saved_mixes_shared table
CREATE TABLE IF NOT EXISTS saved_mixes_shared (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  composition jsonb NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  shared_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_mixes_shared ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all shared mixes"
  ON saved_mixes_shared
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can share their own mixes"
  ON saved_mixes_shared
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared mixes"
  ON saved_mixes_shared
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared mixes"
  ON saved_mixes_shared
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all shared mixes"
  ON saved_mixes_shared
  FOR ALL
  TO authenticated
  USING (auth.email() = 'bruno_wendling@orange.fr')
  WITH CHECK (auth.email() = 'bruno_wendling@orange.fr');

-- Create updated_at trigger
CREATE TRIGGER update_saved_mixes_shared_updated_at
  BEFORE UPDATE ON saved_mixes_shared
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_saved_mixes_shared_user_id ON saved_mixes_shared(user_id);
CREATE INDEX idx_saved_mixes_shared_shared_at ON saved_mixes_shared(shared_at);
CREATE INDEX idx_saved_mixes_shared_tags ON saved_mixes_shared USING gin(tags);
