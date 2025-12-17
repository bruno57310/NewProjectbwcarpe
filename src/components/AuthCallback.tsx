import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

function AuthCallback() {
  const [status, setStatus] = useState('Vérification en cours...');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Starting verification');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        console.log('Referrer:', document.referrer);

        // Get all possible parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const token = queryParams.get('token');
        const tokenHash = queryParams.get('token_hash');
        const code = queryParams.get('code');
        const type = queryParams.get('type') || hashParams.get('type');
        const flow = queryParams.get('flow'); // Check for flow=recovery parameter
        const error = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        console.log('📦 Parameters found:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          token: !!token,
          tokenHash: !!tokenHash,
          code: !!code,
          type,
          flow,
          error
        });

        // Check for error
        if (error) {
          console.error('❌ Error in URL:', error, errorDescription);
          throw new Error(errorDescription || 'Authentication error');
        }

        // Try to get existing session first (in case /auth/v1/verify already created it)
        setStatus('Vérification de la session existante...');
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('📋 Session data:', {
          hasSession: !!sessionData.session,
          user: sessionData.session?.user?.email
        });

        // Check if this is a password reset flow
        // Priority: flow parameter > type parameter > localStorage flag
        const isPasswordReset = flow === 'recovery' ||
                                type === 'recovery' ||
                                localStorage.getItem('passwordResetRequested') === 'true';
        console.log('🔐 Password reset flow:', isPasswordReset, '(flow:', flow, 'type:', type, ')');

        if (sessionData.session) {
          console.log('✅ Found existing session for:', sessionData.session.user.email);

          // Check if this is a recovery session
          if (isPasswordReset) {
            console.log('🔐 Recovery session detected, redirecting to reset password');
            localStorage.removeItem('passwordResetRequested'); // Clean up
            navigate('/reset-password', { replace: true });
            return;
          }

          navigate('/', { replace: true });
          return;
        }

        // No existing session, try to create one from URL parameters
        setStatus('Création de la session...');

        // Try OAuth2 PKCE code exchange (for both SSO flows and recovery)
        if (code) {
          console.log('🔄 Exchanging OAuth2 PKCE code...');
          const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);

          if (codeError) {
            console.warn('⚠️ PKCE exchange failed:', codeError);
            // Fall through to try other methods
          } else if (data.session) {
            console.log('✅ OAuth2 PKCE session created');
            if (isPasswordReset) {
              localStorage.removeItem('passwordResetRequested');
              navigate('/reset-password', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
            return;
          }
        }

        // Try PKCE token (format: pkce_xxxxx) - works for both signup and recovery
        if (token && token.startsWith('pkce_')) {
          console.log('🔄 Verifying PKCE token with verifyOtp...', { type });
          const { data, error: pkceError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any || 'recovery'
          });

          if (pkceError) {
            console.warn('⚠️ PKCE verification failed:', pkceError);
            // Fall through to try other methods
          } else if (data.session) {
            console.log('✅ PKCE session created for type:', type);
            if (isPasswordReset) {
              localStorage.removeItem('passwordResetRequested');
              navigate('/reset-password', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
            return;
          }
        }

        // Try hash-based tokens
        if (accessToken && refreshToken) {
          console.log('🔄 Setting session from hash tokens...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) throw sessionError;

          if (data.session) {
            console.log('✅ Hash session created');
            if (isPasswordReset) {
              localStorage.removeItem('passwordResetRequested'); // Clean up
              navigate('/reset-password', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
            return;
          }
        }

        // Try token verification
        if (token || tokenHash) {
          console.log('🔄 Verifying token:', { token: !!token, tokenHash: !!tokenHash, type });
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token!,
            type: type as any
          });

          if (verifyError) {
            // Check if it's an expired/invalid token error
            if (verifyError.message.includes('expired') || verifyError.message.includes('invalid')) {
              throw new Error('Ce lien a expiré ou a déjà été utilisé. Veuillez demander un nouveau lien de réinitialisation.');
            }
            throw verifyError;
          }

          if (data.session) {
            console.log('✅ Token verified, session created');
            if (isPasswordReset) {
              localStorage.removeItem('passwordResetRequested'); // Clean up
              navigate('/reset-password', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
            return;
          }
        }

        // Check if we're being redirected from Supabase auth endpoint
        // In this case, the session might already be created server-side
        // but not yet available in the client
        if (isPasswordReset && !accessToken && !code && !token) {
          console.log('🔄 Recovery redirect detected, checking referrer for token...');

          // Try to extract token from referrer URL
          if (document.referrer) {
            try {
              const referrerUrl = new URL(document.referrer);
              const referrerToken = referrerUrl.searchParams.get('token');

              if (referrerToken && referrerToken.startsWith('pkce_')) {
                console.log('🔑 Found PKCE token in referrer, exchanging for session...');
                setStatus('Échange du token...');

                const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                  token_hash: referrerToken,
                  type: 'recovery'
                });

                if (!verifyError && verifyData.session) {
                  console.log('✅ Token verified, session created from referrer');
                  localStorage.removeItem('passwordResetRequested');
                  navigate('/reset-password', { replace: true });
                  return;
                }

                console.warn('⚠️ Token verification from referrer failed:', verifyError);
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse referrer URL:', e);
            }
          }

          console.log('🔄 Waiting for session...');
          setStatus('Récupération de la session...');

          // Wait a bit and check for session again (Supabase might still be creating it)
          await new Promise(resolve => setTimeout(resolve, 1500));

          const { data: retrySessionData } = await supabase.auth.getSession();
          console.log('📋 Retry session check:', retrySessionData);

          if (retrySessionData.session) {
            console.log('✅ Session found after retry');
            localStorage.removeItem('passwordResetRequested'); // Clean up
            navigate('/reset-password', { replace: true });
            return;
          }

          // Try one more time with a longer delay
          console.log('⏳ Second retry attempt...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          const { data: secondRetryData } = await supabase.auth.getSession();
          console.log('📋 Second retry session check:', secondRetryData);

          if (secondRetryData.session) {
            console.log('✅ Session found after second retry');
            localStorage.removeItem('passwordResetRequested'); // Clean up
            navigate('/reset-password', { replace: true });
            return;
          }
        }

        // No valid authentication found
        localStorage.removeItem('passwordResetRequested'); // Clean up even on failure
        throw new Error('Aucun paramètre d\'authentification valide trouvé');

      } catch (err) {
        console.error('❌ Callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erreur d\'authentification';
        setStatus(`Erreur: ${errorMessage}`);

        setTimeout(() => {
          navigate('/auth', {
            state: { error: errorMessage },
            replace: true
          });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentification
        </h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

export default AuthCallback;
