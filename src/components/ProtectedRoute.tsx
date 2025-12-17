import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import type { Subscription } from '../types/subscription';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresSubscription?: boolean;
}

export default function ProtectedRoute({ children, requiresSubscription = false }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5; // Increased from 3 to 5 for more resilience
  const INITIAL_RETRY_DELAY = 1000; // 1 second
  const MAX_RETRY_DELAY = 16000; // 16 seconds

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check network connectivity first
        if (!navigator.onLine) {
          throw new Error('No internet connection. Please check your network connection and try again.');
        }

        // Test Supabase connection with enhanced error handling
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          throw new Error('Unable to establish connection with the database. Please try again later.');
        }

        const { data, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('login_id', user.id)
          .maybeSingle();

        if (subscriptionError) {
          throw new Error(`Database error: ${subscriptionError.message}`);
        }

        setSubscription(data);
        setError(null);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.error('Error fetching subscription:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription data';
        setError(errorMessage);

        // Enhanced retry logic with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(
            INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
            MAX_RETRY_DELAY
          );
          
          console.log(`Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchSubscription();
          }, delay);
        }
      } finally {
        setLoading(false);
      }
    };

    // Add network status event listeners
    const handleOnline = () => {
      setError(null);
      setRetryCount(0);
      fetchSubscription();
    };

    const handleOffline = () => {
      setError('Network connection lost. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchSubscription();

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, retryCount]);

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-center text-gray-700 mb-2">Unable to load subscription data</p>
        <p className="text-center text-sm text-gray-500">{error}</p>
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => {
              setRetryCount(0);
              setError(null);
              setLoading(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Reload Page
          </button>
        </div>
        {!navigator.onLine && (
          <p className="mt-4 text-sm text-amber-600">
            You appear to be offline. Please check your internet connection.
          </p>
        )}
      </div>
    );
  }

  // For enterprise-only routes, redirect to pricing if not enterprise
  if (location.pathname === '/catalog/enterprise' || location.pathname === '/catalog/private') {
    if (!subscription || subscription.tier !== 'enterprise') {
      return <Navigate to="/pricing" replace />;
    }
  }

  // For subscription-required routes, let the component handle the demo/full version
  return <>{children}</>;
}
