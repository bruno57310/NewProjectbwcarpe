/*
  # Add shared mix management functions

  1. New Functions
    - `clean_saved_mixes_shared`: Remove all entries from saved_mixes_shared table
    - `sync_saved_mixes_shared`: Sync shared mixes based on shared column in saved_mixes
    
  2. Changes to saved_mixes table
    - Add shared column (boolean) to track sharing status
    
  3. Security
    - Functions are security definer to allow proper access
    - Maintain existing RLS policies
*/

-- Add shared column to saved_mixes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'saved_mixes' 
    AND column_name = 'shared'
  ) THEN
    ALTER TABLE saved_mixes 
    ADD COLUMN shared boolean DEFAULT false;
  END IF;
END $$;

-- Create function to clean saved_mixes_shared table
CREATE OR REPLACE FUNCTION public.clean_saved_mixes_shared()
RETURNS void AS $$
BEGIN
  DELETE FROM saved_mixes_shared;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync saved_mixes_shared based on shared column
CREATE OR REPLACE FUNCTION public.sync_saved_mixes_shared()
RETURNS void AS $$
BEGIN
  -- Insert all mixes that are marked as shared but not yet in saved_mixes_shared
  INSERT INTO saved_mixes_shared (
    user_id,
    name,
    description,
    composition,
    tags,
    shared_at,
    created_at,
    updated_at
  )
  SELECT 
    sm.user_id,
    sm.name,
    sm.description,
    sm.composition,
    sm.tags,
    now() as shared_at,
    sm.created_at,
    sm.updated_at
  FROM saved_mixes sm
  WHERE sm.shared = true
  AND NOT EXISTS (
    SELECT 1 FROM saved_mixes_shared sms 
    WHERE sms.user_id = sm.user_id 
    AND sms.name = sm.name
    AND sms.created_at = sm.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.clean_saved_mixes_shared() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_saved_mixes_shared() TO authenticated;

-- Create index on shared column for better performance
CREATE INDEX IF NOT EXISTS idx_saved_mixes_shared ON saved_mixes(shared);
