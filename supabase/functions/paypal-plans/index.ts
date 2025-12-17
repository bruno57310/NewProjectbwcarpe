import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  scope: string;
}

interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: string;
  billing_cycles: any[];
  payment_preferences: any;
  taxes: any;
  create_time: string;
  update_time: string;
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

async function fetchPayPalPlans(accessToken: string): Promise<PayPalPlan[]> {
  const isProduction = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production';
  const baseUrl = isProduction 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  // Fetch plans with pagination
  let allPlans: PayPalPlan[] = [];
  let page = 1;
  const pageSize = 20;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${baseUrl}/v1/billing/plans?page=${page}&page_size=${pageSize}&total_required=true`,
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
      throw new Error(`Failed to fetch PayPal plans: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const plans = data.plans || [];
    
    allPlans = [...allPlans, ...plans];
    
    // Check if there are more pages
    hasMore = plans.length === pageSize;
    page++;
    
    // Safety check to prevent infinite loops
    if (page > 50) {
      console.warn('Reached maximum plan fetch limit');
      break;
    }
  }

  return allPlans;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    console.log('Fetching PayPal plans for admin user:', user.email);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    console.log('PayPal access token obtained successfully');

    // Fetch plans from PayPal
    const plans = await fetchPayPalPlans(accessToken);
    console.log(`Fetched ${plans.length} plans from PayPal`);

    return new Response(
      JSON.stringify({
        plans: plans,
        total: plans.length,
        fetched_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in paypal-plans function:', error);
    
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
