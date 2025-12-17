/*
  # Add saved mixes table for user recipes

  1. New Tables
    - `saved_mixes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `description` (text)
      - `composition` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Users can only read/write their own mixes
*/

-- Create saved_mixes table
CREATE TABLE IF NOT EXISTS saved_mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  composition jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_mixes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own mixes"
  ON saved_mixes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own mixes"
  ON saved_mixes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mixes"
  ON saved_mixes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mixes"
  ON saved_mixes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_saved_mixes_updated_at
  BEFORE UPDATE ON saved_mixes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_saved_mixes_user_id ON saved_mixes(user_id);
CREATE INDEX idx_saved_mixes_created_at ON saved_mixes(created_at);
