/*
  # Fix mechanical properties column type

  1. Changes
    - Update mechanical_properties column in flours and flours_template tables to use correct JSONB structure
    - Add check constraint to ensure valid values for mechanical properties

  2. Security
    - No changes to security policies
*/

-- Update mechanical_properties column in flours table
ALTER TABLE flours 
DROP CONSTRAINT IF EXISTS check_mechanical_properties_values;

ALTER TABLE flours 
ADD CONSTRAINT check_mechanical_properties_values 
CHECK (
  (mechanical_properties->>'binding')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'stickiness')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'water_absorption')::text IN ('low', 'medium', 'high')
);

-- Update mechanical_properties column in flours_template table
ALTER TABLE flours_template 
DROP CONSTRAINT IF EXISTS check_mechanical_properties_values;

ALTER TABLE flours_template 
ADD CONSTRAINT check_mechanical_properties_values 
CHECK (
  (mechanical_properties->>'binding')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'stickiness')::text IN ('low', 'medium', 'high') AND
  (mechanical_properties->>'water_absorption')::text IN ('low', 'medium', 'high')
);
