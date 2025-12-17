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

interface PayPalSubscription {
  id: string;
  status: string;
  start_time: string;
  billing_info: any;
  subscriber: any;
  auto_renewal: boolean;
  plan_overridden: boolean;
  create_time: string;
  update_time: string;
  plan_id: string;
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

async function fetchPayPalSubscriptions(accessToken: string): Promise<PayPalSubscription[]> {
  const isProduction = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production';
  const baseUrl = isProduction 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  // Fetch subscriptions with pagination
  let allSubscriptions: PayPalSubscription[] = [];
  let startIndex = 0;
  const size = 20; // PayPal's max page size
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${baseUrl}/v1/billing/subscriptions?start_index=${startIndex}&size=${size}`,
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
      throw new Error(`Failed to fetch PayPal subscriptions: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const subscriptions = data.subscriptions || [];
    
    allSubscriptions = [...allSubscriptions, ...subscriptions];
    
    // Check if there are more pages
    hasMore = subscriptions.length === size;
    startIndex += size;
    
    // Safety check to prevent infinite loops
    if (startIndex > 1000) {
      console.warn('Reached maximum subscription fetch limit');
      break;
    }
  }

  return allSubscriptions;
}

async function enrichSubscriptionsWithUserEmails(subscriptions: PayPalSubscription[]) {
  // Extract unique email addresses from PayPal subscriptions
  const paypalEmails = [...new Set(subscriptions.map(sub => sub.subscriber?.email_address).filter(Boolean))];
  
  if (paypalEmails.length === 0) {
    return subscriptions.map(sub => ({
      ...sub,
      user_email: sub.subscriber?.email_address || 'Unknown'
    }));
  }

  try {
    // Get user emails from our database that match PayPal emails
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('email')
      .in('email', paypalEmails);

    if (error) {
      console.error('Error fetching user profiles:', error);
      // Fallback to PayPal emails
      return subscriptions.map(sub => ({
        ...sub,
        user_email: sub.subscriber?.email_address || 'Unknown'
      }));
    }

    // Create a set of known emails for quick lookup
    const knownEmails = new Set(profiles?.map(p => p.email) || []);

    return subscriptions.map(sub => ({
      ...sub,
      user_email: sub.subscriber?.email_address || 'Unknown',
      is_registered_user: knownEmails.has(sub.subscriber?.email_address)
    }));
  } catch (err) {
    console.error('Error enriching subscriptions:', err);
    // Fallback to PayPal emails
    return subscriptions.map(sub => ({
      ...sub,
      user_email: sub.subscriber?.email_address || 'Unknown'
    }));
  }
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

    console.log('Fetching PayPal subscriptions for admin user:', user.email);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    console.log('PayPal access token obtained successfully');

    // Fetch subscriptions from PayPal
    const subscriptions = await fetchPayPalSubscriptions(accessToken);
    console.log(`Fetched ${subscriptions.length} subscriptions from PayPal`);

    // Enrich with user email data
    const enrichedSubscriptions = await enrichSubscriptionsWithUserEmails(subscriptions);

    return new Response(
      JSON.stringify({
        subscriptions: enrichedSubscriptions,
        total: enrichedSubscriptions.length,
        fetched_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in paypal-subscriptions function:', error);
    
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
