/*
  # Fix mechanical properties column type

  1. Changes
    - Modify the mechanical_properties column in flours table to ensure proper JSONB validation
    - Add check constraint to validate mechanical properties values

  2. Security
    - No changes to RLS policies
*/

DO $$ 
BEGIN
  -- Add check constraint to validate mechanical properties structure and values
  ALTER TABLE flours
  ADD CONSTRAINT check_mechanical_properties_values
  CHECK (
    (mechanical_properties->>'binding')::text IN ('low', 'medium', 'high') AND
    (mechanical_properties->>'stickiness')::text IN ('low', 'medium', 'high') AND
    (mechanical_properties->>'water_absorption')::text IN ('low', 'medium', 'high')
  );

  -- Add check constraint to validate mechanical properties structure
  ALTER TABLE flours
  ADD CONSTRAINT check_mechanical_properties_structure
  CHECK (
    mechanical_properties ?& array['binding', 'stickiness', 'water_absorption']
  );
END $$;
