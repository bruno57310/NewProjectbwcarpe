import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  subscriptionTier: string;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  refreshSubscription: () => Promise<void>; // Added refresh capability
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionTier = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('login_id', userId)
        .single();

      if (error) {
        console.error('Subscription fetch error:', error);
        return 'free';
      }

      return data?.tier || 'free';
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return 'free';
    }
  };

  const refreshSubscription = async () => {
    if (user?.id) {
      const tier = await fetchSubscriptionTier(user.id);
      setSubscriptionTier(tier);
    }
  };

  const handleAuthState = async (session: Session | null) => {
    const currentUser = session?.user || null;
    setUser(currentUser);
    
    if (currentUser) {
      const tier = await fetchSubscriptionTier(currentUser.id);
      setSubscriptionTier(tier);
      console.log(`🔑 Auth state updated - User: ${currentUser.email}, Tier: ${tier}`);
    } else {
      setSubscriptionTier('free');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleAuthState(session);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleAuthState(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const value = {
    user,
    subscriptionTier,
    signUp,
    signIn,
    signOut,
    resetPassword,
    loading,
    refreshSubscription // Expose refresh method
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
