import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { identifyUser, trackEvent } from '../lib/loops';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  subscriptionTier: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<{ error?: Error }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionTier = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('login_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching subscription tier:', error);
        return 'free';
      }

      return data?.tier || 'free';
    } catch (err) {
      console.warn('Error fetching subscription tier:', err);
      return 'free';
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Clear URL hash after handling auth response
        if (window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          await identifyUser(session.user.id, {
            email: session.user.email,
            lastLogin: new Date().toISOString()
          });

          fetchSubscriptionTier(session.user.id).then(tier => {
            setSubscriptionTier(tier);
          });
        }
      } catch (error) {
        console.warn('Error getting session:', error);
        await handleSignOut();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);

      switch (event) {
        case 'INITIAL_SESSION':
          // This event is fired when getSession returns an existing session on page load
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchSubscriptionTier(session.user.id).then(tier => {
              setSubscriptionTier(tier);
            });
          }
          break;
        case 'SIGNED_IN':
          setUser(session?.user ?? null);

          if (session?.user) {
            await identifyUser(session.user.id, {
              email: session.user.email,
              lastLogin: new Date().toISOString()
            });

            await trackEvent(session.user.id, 'user_signed_in');

            fetchSubscriptionTier(session.user.id).then(tier => {
              setSubscriptionTier(tier);
            });
          }
          break;
        case 'SIGNED_OUT':
          await handleSignOut();
          break;
        case 'TOKEN_REFRESHED':
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchSubscriptionTier(session.user.id).then(tier => {
              setSubscriptionTier(tier);
            });
          }
          break;
        case 'USER_UPDATED':
          console.log('User updated event received', session?.user);
          setUser(session?.user ?? null);
          break;
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery event received');
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('Password recovery for user:', session.user.email);
            // DO NOT redirect here - the email link already opens /reset-password
            // Redirecting here would reload the page and lose the session
            // If user is on /reset-password, they already have the session
            // If user is elsewhere, this is a broadcast from another tab - ignore it
          }
          break;
        default:
          // Unknown event - log it but don't sign out
          console.warn('Unknown auth event:', event);
          break;
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (user) {
      await trackEvent(user.id, 'user_signed_out');
    }

    setUser(null);
    setSubscriptionTier(null);
    
    // Clear all Supabase-related items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Clear all Supabase-related items from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}; secure; samesite=strict`;
    });

    sessionStorage.clear();
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        },
      });
      
      if (error) {
        if (error.message.toLowerCase().includes('rate limit') || 
            error.message.toLowerCase().includes('too many requests')) {
          throw new Error('email rate limit exceeded');
        }
        
        // Handle email confirmation errors for self-hosted Supabase
        if (error.message.toLowerCase().includes('error sending confirmation mail') ||
            error.message.toLowerCase().includes('email not configured') ||
            error.message.toLowerCase().includes('smtp')) {
          console.warn('Email confirmation disabled due to SMTP configuration:', error.message);
          
          // Try signup without email confirmation
          const { error: retryError, data: retryData } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                email_confirm: false
              }
            }
          });
          
          if (retryError) {
            console.error('Retry signup error:', retryError);
            throw retryError;
          }
          
          // If successful, continue with the normal flow
          if (retryData.user) {
            await identifyUser(retryData.user.id, {
              email: retryData.user.email,
              signupDate: new Date().toISOString()
            });
            
            try {
              const { error: subscriptionError } = await supabase
                .from('subscriptions')
                .insert([{
                  login_id: retryData.user.id,
                  tier: 'free',
                  active: true,
                  current_period_start: new Date().toISOString(),
                  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  cancel_at_period_end: false
                }]);
              
              if (subscriptionError) {
                console.error('Error creating initial subscription:', subscriptionError);
              }
            } catch (err) {
              console.error('Error creating initial subscription:', err);
            }
          }
          
          return; // Exit successfully
        }
        
        console.error('Sign up error:', {
          message: error.message,
          code: error.code,
          status: error.status
        });
        throw error;
      }
      
      if (data.user) {
        await identifyUser(data.user.id, {
          email: data.user.email,
          signupDate: new Date().toISOString()
        });
        
        try {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert([{
              login_id: data.user.id,
              tier: 'free',
              active: true,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancel_at_period_end: false
            }]);
          
          if (subscriptionError) {
            console.error('Error creating initial subscription:', subscriptionError);
          }
        } catch (err) {
          console.error('Error creating initial subscription:', err);
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', {
          message: error.message,
          code: error.code,
          status: error.status
        });
        throw error;
      }
      
      if (data.user) {
        await trackEvent(data.user.id, 'user_signed_in');
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Enhanced error handling for network issues
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          throw new Error('Impossible de se connecter au serveur. Vérifiez que votre instance Supabase est en cours d\'exécution et que CORS est correctement configuré.');
        }
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          throw new Error('Erreur de réseau. Vérifiez votre connexion internet et la configuration de votre serveur.');
        }
      }
      
      throw error;
    }
  };

  const resetPassword = async (email: string, redirectTo?: string) => {
    try {
      console.log('Requesting password reset for:', email, 'redirectTo:', redirectTo);

      // Redirect DIRECTLY to /reset-password to avoid losing PKCE tokens
      // The ResetPassword component will handle the code parameter
      const callbackUrl = 'https://bwcarpe.com/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || callbackUrl
      });

      if (error) {
        console.error('Reset password error:', {
          message: error.message,
          code: error.code,
          status: error.status
        });

        // Check for rate limit error and throw appropriate error
        if (error.message.toLowerCase().includes('rate limit') ||
            error.message.toLowerCase().includes('too many requests') ||
            error.message.toLowerCase().includes('for security purposes')) {
          const waitTime = error.message.match(/\d+/)?.[0] || '60';
          throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
        }

        return { error };
      }

      console.log('Password reset email sent successfully');
      await trackEvent('anonymous', 'password_reset_requested', { email });

      return {};
    } catch (error) {
      console.error('Unexpected error during reset:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const signOut = async () => {
    try {
      await handleSignOut();
      
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          if (error.message?.includes('session_not_found') || error.message?.includes('JWT')) {
            console.info('Session already cleared on server');
            return;
          }
          throw error;
        }
      } catch (error: any) {
        if (error.message?.includes('session_not_found') || error.message?.includes('JWT')) {
          console.info('Session already cleared on server');
          return;
        }
        console.warn('Supabase sign out failed:', error);
      }
    } catch (error) {
      console.warn('Error during sign out:', error);
      await handleSignOut();
    }
  };

  const value = {
    user,
    subscriptionTier,
    signUp,
    signIn,
    signOut,
    resetPassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
