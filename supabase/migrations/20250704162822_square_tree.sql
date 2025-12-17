/*
  # Add N8N Chat History Table

  1. New Table
    - `n8n_chat_histories`: Store chat history for N8N integrations
    - Disable RLS to allow direct access from Netlify functions
    - Track session ID and message content

  2. Security
    - Disable RLS to allow serverless function access
    - No user-specific data stored in this table
*/

-- Create n8n_chat_histories table if it doesn't exist
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  message JSONB NOT NULL
);

-- Disable RLS for this table to allow access from Netlify functions
ALTER TABLE n8n_chat_histories DISABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_session_id ON n8n_chat_histories(session_id);
