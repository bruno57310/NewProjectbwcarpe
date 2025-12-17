import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  scope: string;
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const isProduction = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production';
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const baseUrl = isProduction 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get PayPal access token: ${response.status} ${errorText}`);
  }

  const data: PayPalTokenResponse = await response.json();
  return data.access_token;
}

async function fetchPayPalSubscriptionDetails(subscriptionId: string, accessToken: string) {
  const isProduction = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production';
  const baseUrl = isProduction 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch PayPal subscription details: ${response.status} ${errorText}`);
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Get user from Supabase auth
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check if user is admin
    if (user.email !== 'bruno_wendling@orange.fr') {
      throw new Error('Access denied. Admin privileges required.');
    }

    // Get subscription ID from URL parameters
    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get('id');
    
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    console.log('Fetching PayPal subscription details for:', subscriptionId);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Fetch subscription details from PayPal
    const subscription = await fetchPayPalSubscriptionDetails(subscriptionId, accessToken);

    return new Response(
      JSON.stringify({
        subscription: subscription,
        fetched_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in paypal-subscription-details function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack || 'No additional details available'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
