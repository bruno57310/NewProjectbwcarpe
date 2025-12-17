import { supabase } from './supabase';

export async function sendToN8n(ids, mixWeights = {}) {
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
    throw new Error("You must select between 2 and 4 IDs.");
  }
  
  // Get the current user's email from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email || 'anonymous@example.com';
  
  const response = await fetch("/.netlify/functions/send-to-n8n", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, userEmail, mixWeights })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server error: ${text}`);
  }

  return response.json();
}
