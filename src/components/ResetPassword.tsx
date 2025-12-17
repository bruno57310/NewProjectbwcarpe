import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [tokenType, setTokenType] = useState<'hash' | 'query' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Check for access token in URL hash or query params on component mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        console.log('🔍 ResetPassword component mounted');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        console.log('Pathname:', window.location.pathname);

        // FIRST: Check if there's already an active session
        // (AuthCallback may have already set it up)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log('✅ Found existing session for:', sessionData.session.user.email);
          setHasValidToken(true);
          setTokenType('hash');
          // Clean URL if there are any params
          if (window.location.hash || window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          return;
        }

        console.log('No existing session, checking URL for tokens...');

        // First check for hash params (SPA redirect from Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');

        // Then check for query params (direct email link)
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');
        const tokenHash = queryParams.get('token_hash');
        const code = queryParams.get('code'); // PKCE code
        const queryType = queryParams.get('type');
        const errorCode = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        console.log('🔐 FULL HASH FRAGMENT:', window.location.hash);
        console.log('🔐 ACCESS TOKEN:', accessToken);
        console.log('🔐 REFRESH TOKEN:', refreshToken);
        console.log('🔐 PKCE CODE:', code);
        console.log('Token check results:', {
          hash: { accessToken: !!accessToken, refreshToken: !!refreshToken, type: hashType },
          query: { token: !!token, tokenHash: !!tokenHash, code: !!code, type: queryType, error: errorCode }
        });

        // Check for error in URL
        if (errorCode) {
          console.error('Auth error in URL:', errorCode, errorDescription);
          throw new Error(errorDescription || 'Authentication error');
        }

        // If we have PKCE code in query params (modern PKCE flow)
        if (code) {
          console.log('🔄 Exchanging PKCE code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('❌ Error exchanging PKCE code:', error);
            setHasValidToken(false);
            throw error;
          } else if (data.session) {
            setHasValidToken(true);
            setTokenType('query');
            console.log('✅ PKCE session set successfully for user:', data?.user?.email);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error('No session returned from PKCE code exchange');
          }
        }
        // If we have tokens in the URL hash, set the session
        else if (accessToken && refreshToken && hashType === 'recovery') {
          console.log('Setting session from hash params...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session:', error);
            setHasValidToken(false);
            throw error;
          } else {
            setHasValidToken(true);
            setTokenType('hash');
            console.log('Session set successfully for user:', data?.user?.email);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        // If we have token_hash in query params
        else if (tokenHash && queryType === 'recovery') {
          console.log('Verifying token_hash...');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          });

          if (error) {
            console.error('Error verifying token_hash:', error);
            throw error;
          }

          if (data.session) {
            setHasValidToken(true);
            setTokenType('hash');
            console.log('Token verified, session set for user:', data.user?.email);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error('No session returned from token verification');
          }
        }
        // If we have token in query params (from email link before Supabase redirect)
        else if (token && queryType === 'recovery') {
          console.log('Verifying token from email...');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });

          if (error) {
            console.error('Error verifying token:', error);
            throw error;
          }

          if (data.session) {
            setHasValidToken(true);
            setTokenType('hash');
            console.log('Token verified, session set for user:', data.user?.email);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error('No session returned from token verification');
          }
        }
        // No valid token found
        else {
          console.error('No valid token parameters found in URL');
          setHasValidToken(false);
          throw new Error('No valid reset token found in URL. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setHasValidToken(false);

        const errorMessage = err instanceof Error ? err.message : t('auth.invalidResetLink');
        setError(errorMessage);

        // Delay navigation to allow error to be displayed (increased to 5 seconds)
        setTimeout(() => {
          navigate('/auth', {
            state: {
              error: errorMessage
            },
            replace: true
          });
        }, 5000);
      }
    };

    checkToken();
  }, [navigate, t]);

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!validatePassword(password)) {
      setError(t('auth.passwordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      // Since we now have a valid session (set during token verification), just update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      console.log('Password updated successfully');

      // Password reset successful
      setSuccess(t('auth.passwordResetSuccess'));

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth', {
          state: {
            message: t('auth.passwordResetSuccessLogin')
          },
          replace: true
        });
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('auth.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasValidToken && !loading && error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-red-700" />
            </div>
            <h2 className="text-2xl font-bold text-red-800">
              {t('auth.resetPassword')}
            </h2>
          </div>

          <div className="p-4 rounded-lg mb-6 flex items-start gap-3 bg-red-50 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-green-700 hover:text-green-600 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-green-800">
            {t('auth.setNewPassword')}
          </h2>
        </div>

        {(error || success) && (
          <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${
            success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {success ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{success || error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-600 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? t('common.loading') : t('auth.resetPassword')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/auth')}
            className="text-green-700 hover:text-green-600 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
