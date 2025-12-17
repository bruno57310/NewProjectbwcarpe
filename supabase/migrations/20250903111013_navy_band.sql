-- Fix Pro user mix limit in database
-- This should be run in your Supabase SQL editor

UPDATE mix_limits 
SET max_mixes = 3 
WHERE tier = 'pro';

-- Verify the update
SELECT tier, max_mixes FROM mix_limits ORDER BY tier;
