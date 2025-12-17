/*
  # Remove n8n_chat_histories table

  1. Changes
    - Drop n8n_chat_histories table if it exists
    - Remove any related indexes
    
  2. Security
    - No security implications as the table is being removed
*/

-- Drop the table if it exists
DROP TABLE IF EXISTS n8n_chat_histories;
