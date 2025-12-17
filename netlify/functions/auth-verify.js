/**
 * Netlify Edge Function to handle Supabase password reset verification
 *
 * This intercepts the Supabase verify link and properly redirects with tokens
 */

export default async (req, context) => {
  const url = new URL(req.url);

  // Get token and type from query params
  const token = url.searchParams.get('token');
  const type = url.searchParams.get('type');
  const redirectTo = url.searchParams.get('redirect_to');

  console.log('Auth verify received:', { token: !!token, type, redirectTo });

  // If no token, redirect to error page
  if (!token || type !== 'recovery') {
    return Response.redirect(
      `${url.origin}/auth?error=Invalid reset link`,
      302
    );
  }

  try {
    // Instead of calling the API ourselves, just redirect to the frontend
    // with the token so that the client-side Supabase SDK can handle verification
    // This avoids issues with server-side auth and lets the client manage the session

    // Redirect to AuthCallback with the token parameters
    const callbackParams = new URLSearchParams({
      token,
      type: 'recovery',
      flow: 'recovery'
    });

    return Response.redirect(
      `${url.origin}/auth/callback?${callbackParams.toString()}`,
      302
    );
  } catch (error) {
    console.error('Auth verify error:', error);
    return Response.redirect(
      `${url.origin}/auth?error=${encodeURIComponent('Failed to verify reset token')}`,
      302
    );
  }
};

export const config = {
  path: '/auth/v1/verify',
};
