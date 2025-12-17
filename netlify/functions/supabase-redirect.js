// Netlify Function to redirect Supabase recovery links to the frontend
exports.handler = async (event) => {
  console.log('🔄 Supabase redirect function called');
  console.log('📥 Query params received:', JSON.stringify(event.queryStringParameters, null, 2));

  const { token, type, token_hash, code, error, error_description, redirect_to } = event.queryStringParameters || {};

  console.log('🔑 Extracted token:', token);
  console.log('📋 Extracted type:', type);
  console.log('🎯 Extracted redirect_to:', redirect_to);

  // Build the redirect URL with all parameters
  const params = new URLSearchParams();

  if (token) params.append('token', token);
  if (type) params.append('type', type);
  if (token_hash) params.append('token_hash', token_hash);
  if (code) params.append('code', code);
  if (error) params.append('error', error);
  if (error_description) params.append('error_description', error_description);

  console.log('📦 Params built:', params.toString());

  // Use redirect_to if provided, otherwise fallback based on type
  let redirectUrl;
  if (redirect_to) {
    try {
      // Parse the redirect_to URL - ensure it's an absolute URL to bwcarpe.com
      const url = new URL(redirect_to, 'https://bwcarpe.com');

      // Force the hostname to be bwcarpe.com (not api.bwcarpe.com)
      url.hostname = 'bwcarpe.com';
      url.protocol = 'https:';

      // IMPORTANT: Always redirect to /auth/callback instead of /auth
      // because /auth is the login page and /auth/callback handles tokens
      if (url.pathname === '/auth' || url.pathname === '/auth/') {
        url.pathname = '/auth/callback';
        console.log('🔀 Redirecting to /auth/callback instead of /auth');
      }

      // Merge parameters
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });

      // Return the full absolute URL
      redirectUrl = url.toString();
      console.log('✅ Built URL from redirect_to:', redirectUrl);
    } catch (e) {
      console.warn('⚠️ Failed to parse redirect_to, using default:', e.message);
      redirectUrl = `https://bwcarpe.com/reset-password?${params.toString()}`;
    }
  } else {
    console.log('⚠️ No redirect_to provided, using default');
    redirectUrl = `https://bwcarpe.com/reset-password?${params.toString()}`;
  }

  console.log('🚀 FINAL REDIRECT URL:', redirectUrl);

  return {
    statusCode: 302,
    headers: {
      Location: redirectUrl,
      'Cache-Control': 'no-cache'
    },
    body: ''
  };
};
