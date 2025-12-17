import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetDisabled, setResetDisabled] = useState(false);
  const [resetTimer, setResetTimer] = useState(0);
  const [emailAttempts, setEmailAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword } = useAuth();
  const { t, i18n } = useTranslation();

  // Constants for rate limiting - adjusted for Supabase's limits
  const MAX_EMAIL_ATTEMPTS = 3;
  const MAX_SIGNUP_ATTEMPTS = 3;
  const RATE_LIMIT_DURATION = 3600; // 1 hour in seconds
  const RETRY_COOLDOWN = 60; // 1 minute cooldown between attempts
  const SIGNUP_COOLDOWN = 300; // 5 minutes cooldown for signup attempts
  const RESET_PASSWORD_COOLDOWN = 60; // 1 minute cooldown for password reset

  useEffect(() => {
    let interval: number | undefined;
    if (resetTimer > 0) {
      interval = window.setInterval(() => {
        setResetTimer((prev) => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            setResetDisabled(false);
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resetTimer]);

  // Reset attempts after rate limit duration
  useEffect(() => {
    const checkRateLimit = () => {
      const now = Date.now();
      
      if (lastAttemptTime) {
        const timeElapsed = (now - lastAttemptTime) / 1000;
        if (timeElapsed >= RATE_LIMIT_DURATION) {
          setEmailAttempts(0);
          setResetDisabled(false);
          setLastAttemptTime(null);
          setError('');
        }
      }

      if (lastSignupAttempt) {
        const signupTimeElapsed = (now - lastSignupAttempt) / 1000;
        if (signupTimeElapsed >= RATE_LIMIT_DURATION) {
          setSignupAttempts(0);
          setLastSignupAttempt(null);
          setError('');
        }
      }
    };

    const interval = setInterval(checkRateLimit, 1000);
    checkRateLimit(); // Check immediately

    return () => clearInterval(interval);
  }, [lastAttemptTime, lastSignupAttempt]);

  // Clear location state after reading it
  useEffect(() => {
    if (location.state?.message || location.state?.error) {
      const newState = { ...location.state };
      delete newState.message;
      delete newState.error;
      navigate(location.pathname, { state: newState, replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} ${t('common.seconds')}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${t('common.minutes')}`;
  };

  const getRemainingTime = (timestamp: number | null, duration: number) => {
    if (!timestamp) return 0;
    const timeElapsed = (Date.now() - timestamp) / 1000;
    return Math.max(0, duration - timeElapsed);
  };

  const isRateLimited = () => {
    if (!isLogin && signupAttempts >= MAX_SIGNUP_ATTEMPTS) {
      return getRemainingTime(lastSignupAttempt, RATE_LIMIT_DURATION);
    }
    if (isForgotPassword && emailAttempts >= MAX_EMAIL_ATTEMPTS) {
      return getRemainingTime(lastAttemptTime, RATE_LIMIT_DURATION);
    }
    if (isForgotPassword && resetDisabled) {
      return resetTimer;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const remainingTime = isRateLimited();
    if (remainingTime > 0) {
      setError(t('auth.tooManyAttempts', { time: formatTimeRemaining(remainingTime) }));
      return;
    }

    // Check rate limiting for password reset
    if (isForgotPassword) {
      if (emailAttempts >= MAX_EMAIL_ATTEMPTS) {
        const remainingTime = Math.ceil(getRemainingTime(lastAttemptTime, RATE_LIMIT_DURATION));
        setError(t('auth.tooManyAttempts', { time: formatTimeRemaining(remainingTime) }));
        return;
      }

      if (resetDisabled) {
        setError(t('auth.resetRateLimit', { time: formatTimeRemaining(resetTimer) }));
        return;
      }
    }

    // Client-side validation
    if (!validateEmail(email)) {
      setError(t('auth.emailRequired'));
      return;
    }

    if (!isForgotPassword && !validatePassword(password)) {
      setError(t('auth.passwordRequired'));
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        // Set cooldown before making the request
        setResetDisabled(true);
        setResetTimer(RESET_PASSWORD_COOLDOWN);

        const origin = window.location.origin;
        // Add flow=recovery parameter to indicate this is a password reset
        const resetUrl = `${origin}/auth/callback?flow=recovery`;

        // Set flag in localStorage as backup (persists across tabs/windows)
        localStorage.setItem('passwordResetRequested', 'true');

        const { error: resetError } = await resetPassword(email, resetUrl);
        
        if (resetError) {
          if (resetError.message.toLowerCase().includes('rate limit') || 
              resetError.message.toLowerCase().includes('too many requests')) {
            setEmailAttempts(MAX_EMAIL_ATTEMPTS);
            setLastAttemptTime(Date.now());
            setResetTimer(RATE_LIMIT_DURATION);
            setResetDisabled(true);
            throw new Error(t('auth.emailRateLimitError'));
          } else if (resetError.message.toLowerCase().includes('error sending recovery email')) {
            throw new Error(t('auth.emailSendError'));
          } else if (resetError.message.toLowerCase().includes('email not found')) {
            throw new Error(t('auth.emailNotFoundError'));
          }
          
          throw resetError;
        }

        setSuccess(t('auth.resetEmailSent'));
        setEmailAttempts(prev => prev + 1);
        setLastAttemptTime(Date.now());
        
      } else if (isLogin) {
        const user = await signIn(email, password);
        if (user) {
          // Use React Router navigation instead of window.location
          navigate('/dashboard');
        }
      } else {
        if (signupAttempts >= MAX_SIGNUP_ATTEMPTS) {
          const remainingTime = Math.ceil(getRemainingTime(lastSignupAttempt, RATE_LIMIT_DURATION));
          throw new Error(t('auth.tooManyAttempts', { time: formatTimeRemaining(remainingTime) }));
        }

        try {
          await signUp(email, password);
          setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          setIsLogin(true);
          setPassword('');
          setSignupAttempts(prev => prev + 1);
          setLastSignupAttempt(Date.now());
        } catch (signUpError: any) {
          console.error('Signup error details:', signUpError);
          
          if (signUpError.message.toLowerCase().includes('rate limit') || 
              signUpError.message.toLowerCase().includes('too many requests')) {
            setSignupAttempts(MAX_SIGNUP_ATTEMPTS);
            setLastSignupAttempt(Date.now());
            throw new Error(t('auth.tooManyAttempts', { time: formatTimeRemaining(SIGNUP_COOLDOWN) }));
          } else if (signUpError.message.toLowerCase().includes('error sending confirmation mail') ||
                     signUpError.message.toLowerCase().includes('email not configured') ||
                     signUpError.message.toLowerCase().includes('smtp')) {
            // Email confirmation failed, but account might have been created
            setSuccess('Compte créé avec succès ! La confirmation par email a échoué mais vous pouvez vous connecter.');
            setIsLogin(true);
            setPassword('');
            return;
          } else if (signUpError.message.toLowerCase().includes('user already registered')) {
            throw new Error('Un compte existe déjà avec cette adresse email. Essayez de vous connecter.');
          }
          throw signUpError;
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (import.meta.env.DEV) {
          console.error('Auth error:', {
            message: err.message,
            timestamp: new Date().toISOString(),
            environment: import.meta.env.MODE,
            language: i18n.language
          });
        }

        if (err.message.toLowerCase().includes('rate limit') || 
            err.message.toLowerCase().includes('too many requests') ||
            err.message.toLowerCase().includes('too many attempts')) {
          if (!isLogin) {
            setSignupAttempts(MAX_SIGNUP_ATTEMPTS);
            setLastSignupAttempt(Date.now());
          }
          const remainingTime = Math.ceil(getRemainingTime(lastSignupAttempt, RATE_LIMIT_DURATION));
          setError(t('auth.tooManyAttempts', { time: formatTimeRemaining(remainingTime || SIGNUP_COOLDOWN) }));
        } else if (err.message.includes('invalid_credentials')) {
          setError(t('auth.loginError'));
        } else if (err.message.includes('email already exists')) {
          setError(t('auth.emailExistsError'));
        } else if (err.message.includes('Un compte existe déjà avec cette adresse email')) {
          setError('Un compte existe déjà avec cette adresse email');
        } else if (err.message.includes('Adresse email invalide')) {
          setError('Veuillez entrer une adresse email valide');
        } else if (err.message.includes('Le mot de passe doit contenir au moins 6 caractères')) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
        } else if (err.message.includes('L\'inscription est temporairement désactivée')) {
          setError('L\'inscription est temporairement désactivée. Veuillez contacter l\'administrateur.');
        } else if (err.message.includes('email not found')) {
          setError(t('auth.emailNotFoundError'));
        } else if (err.message.includes('error sending recovery email')) {
          setError(t('auth.emailSendError'));
          setEmailAttempts(prev => Math.max(0, prev - 1));
          setResetDisabled(false);
        } else if (err.message.includes('signup disabled')) {
          setError('L\'inscription est temporairement désactivée. Veuillez contacter l\'administrateur.');
        } else if (err.message === 'Failed to fetch') {
          setError('Impossible de se connecter au serveur. Vérifiez que votre instance Supabase est en cours d\'exécution et accessible.');
        } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
          setError('Erreur de réseau. Vérifiez votre connexion internet et la configuration CORS de votre serveur.');
        } else if (err.message.includes('Impossible de se connecter au serveur')) {
          setError(err.message);
        } else if (err.message.includes('Erreur de réseau')) {
          setError(err.message);
        } else {
          console.error('Unhandled auth error:', err);
          setError(`Erreur lors de l'inscription: ${err.message || 'Erreur inconnue'}`);
        }
      } else {
        setError(t('auth.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🧪 Testing Supabase connection...');
      
      // Test CORS preflight first
      console.log('🔍 Testing CORS preflight...');
      try {
        const corsTest = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,apikey,content-type'
          },
          mode: 'cors'
        });
        console.log('✅ CORS preflight test result:', corsTest.status, corsTest.statusText);
      } catch (corsError) {
        console.error('❌ CORS preflight failed:', corsError);
        setError(`❌ CORS Error: Votre instance Supabase ne permet pas les requêtes depuis ${window.location.origin}.\n\n🔧 Pour corriger cela:\n1. Ajoutez ces en-têtes CORS à votre configuration Kong/Traefik:\n   - Access-Control-Allow-Origin: ${window.location.origin}\n   - Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH\n   - Access-Control-Allow-Headers: authorization,apikey,content-type,x-client-info\n2. Redémarrez vos services Supabase\n3. Vérifiez que votre instance est accessible sur: ${import.meta.env.VITE_SUPABASE_URL}`);
        return;
      }
      
      // Test basic connectivity
      console.log('🔍 Testing basic connectivity...');
      const testResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        mode: 'cors'
      });
      
      console.log('✅ Basic connectivity test result:', testResponse.status, testResponse.statusText);
      
      // Test auth endpoint specifically
      console.log('🔍 Testing auth endpoint...');
      const authTest = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,apikey,content-type'
        },
        mode: 'cors'
      });
      
      console.log('✅ Auth endpoint CORS test:', authTest.status, authTest.statusText);
      
      // Now try actual login if we have credentials
      if (!email || !password) {
        setError('✅ Tests de connectivité réussis ! Entrez vos identifiants pour tester la connexion complète.');
        return;
      }
      
      // Try login
      console.log('🔍 Testing actual login...');
      const { error: loginError, data: loginData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (loginError) {
        console.error('Login error details:', {
          message: loginError.message,
          status: loginError.status,
          details: loginError
        });
        
        if (loginError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte.');
        } else if (loginError.message === 'Failed to fetch') {
          setError('❌ CORS Error: Votre instance Supabase ne permet pas les requêtes depuis https://localhost:5173. Vérifiez votre configuration Kong/Traefik.');
        } else {
          setError(`Erreur de connexion: ${loginError.message}`);
        }
        return;
      }
      
      console.log('Login successful:', loginData);
      setError('✅ Connexion réussie ! Tous les tests sont passés.');
      
    } catch (error) {
      console.error('Test login error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          setError(`❌ CORS Error: Impossible de se connecter à votre instance Supabase.\n\n🔧 Solutions:\n1. Vérifiez que votre instance Supabase est en cours d'exécution sur: ${import.meta.env.VITE_SUPABASE_URL}\n2. Configurez CORS pour autoriser: ${window.location.origin}\n3. Ajoutez ces en-têtes à votre Kong/Traefik:\n   - Access-Control-Allow-Origin: ${window.location.origin}\n   - Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH\n   - Access-Control-Allow-Headers: authorization,apikey,content-type,x-client-info\n4. Redémarrez vos services après modification\n\n📋 Testez avec curl:\ncurl -i -X OPTIONS -H "Origin: ${window.location.origin}" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,apikey,content-type" ${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token`);
        } else if (error.message.includes('NetworkError')) {
          setError('❌ Network Error: Problème de réseau. Vérifiez votre connexion internet.');
        } else {
          setError(`❌ Error: ${error.message}`);
        }
      } else {
        setError('Une erreur inattendue s\'est produite.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    setIsForgotPassword(true);
    setError('');
    setSuccess('');
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setError('');
    setSuccess('');
    setResetDisabled(false);
    setResetTimer(0);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isButtonDisabled = () => {
    if (loading) return true;
    if (isForgotPassword && (resetDisabled || emailAttempts >= MAX_EMAIL_ATTEMPTS)) return true;
    if (!isLogin && signupAttempts >= MAX_SIGNUP_ATTEMPTS) return true;
    return false;
  };

  // Display subscription update message if present
  const message = location.state?.message;
  const errorMessage = location.state?.error;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <User className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-green-800">
            {isForgotPassword 
              ? t('auth.resetPassword') 
              : isLogin 
                ? t('auth.login') 
                : t('auth.register')}
          </h2>
        </div>

        {(error || message || success || errorMessage) && (
          <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${
            success || message
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {success || message ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{success || message || error || errorMessage}</p>
              {isForgotPassword && success && (
                <p className="mt-2 text-sm">
                  {t('auth.checkSpam')}
                </p>
              )}
              {(resetDisabled || emailAttempts >= MAX_EMAIL_ATTEMPTS || signupAttempts >= MAX_SIGNUP_ATTEMPTS) && (
                <p className="mt-2 text-sm">
                  {t('auth.nextAttemptIn', { 
                    time: formatTimeRemaining(
                      !isLogin ? getRemainingTime(lastSignupAttempt, RATE_LIMIT_DURATION) :
                      emailAttempts >= MAX_EMAIL_ATTEMPTS ? getRemainingTime(lastAttemptTime, RATE_LIMIT_DURATION) :
                      resetTimer
                    )
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
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
              
              {/* Debug button - remove in production */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleTestLogin}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Test Login (Debug)
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isButtonDisabled()}
            className={`w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-600 transition-colors ${
              isButtonDisabled() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading 
              ? t('common.loading') 
              : isForgotPassword
                ? resetDisabled || emailAttempts >= MAX_EMAIL_ATTEMPTS
                  ? `${t('auth.resetPassword')} (${formatTimeRemaining(emailAttempts >= MAX_EMAIL_ATTEMPTS ? getRemainingTime(lastAttemptTime, RATE_LIMIT_DURATION) : resetTimer)})`
                  : t('auth.resetPassword')
                : isLogin 
                  ? t('auth.login') 
                  : signupAttempts >= MAX_SIGNUP_ATTEMPTS
                    ? `${t('auth.register')} (${formatTimeRemaining(getRemainingTime(lastSignupAttempt, RATE_LIMIT_DURATION))})`
                    : t('auth.register')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {isForgotPassword ? (
            <button
              onClick={handleBackToLogin}
              className="text-green-700 hover:text-green-600 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.hasAccount')}
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-green-700 hover:text-green-600 block w-full"
              >
                {isLogin
                  ? t('auth.noAccount')
                  : t('auth.hasAccount')}
              </button>
              
              {isLogin && (
                <button
                  onClick={handleResetPassword}
                  className="text-gray-600 hover:text-gray-800 text-sm block w-full"
                  type="button"
                >
                  {t('auth.forgotPassword')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
