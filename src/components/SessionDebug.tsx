import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function SessionDebug() {
  const { user, subscriptionTier, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [refreshAttempt, setRefreshAttempt] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        setSessionInfo({ session, error });

        // Try to refresh session
        const { data: { session: refreshedSession }, error: refreshError } =
          await supabase.auth.refreshSession();
        setRefreshAttempt({ session: refreshedSession, error: refreshError });

        // Get localStorage data
        const localData: any = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase') || key.startsWith('sb-'))) {
            try {
              localData[key] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch {
              localData[key] = localStorage.getItem(key);
            }
          }
        }
        setLocalStorageData(localData);
      } catch (err) {
        console.error('Session check error:', err);
      }
    };

    checkSession();
  }, []);

  const handleManualLogin = async () => {
    try {
      const email = prompt('Email:');
      const password = prompt('Password:');
      if (email && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          alert(`Erreur: ${error.message}`);
        } else {
          alert('Connexion réussie! Rechargement de la page...');
          window.location.reload();
        }
      }
    } catch (err) {
      alert(`Erreur: ${err}`);
    }
  };

  const handleClearAll = () => {
    if (confirm('Effacer tous les tokens et recharger ?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Session Debug</h1>

        {/* Auth Context Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Auth Context</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? user.email : 'null'}</p>
            <p><strong>User ID:</strong> {user?.id || 'null'}</p>
            <p><strong>Subscription Tier:</strong> {subscriptionTier || 'null'}</p>
          </div>
        </div>

        {/* Current Session */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Current Session (getSession)</h2>
          {sessionInfo ? (
            <div>
              {sessionInfo.error ? (
                <div className="text-red-600">
                  <p><strong>Error:</strong> {sessionInfo.error.message}</p>
                </div>
              ) : sessionInfo.session ? (
                <div className="space-y-2">
                  <p><strong>User Email:</strong> {sessionInfo.session.user.email}</p>
                  <p><strong>User ID:</strong> {sessionInfo.session.user.id}</p>
                  <p><strong>Access Token:</strong> {sessionInfo.session.access_token.substring(0, 50)}...</p>
                  <p><strong>Expires At:</strong> {new Date(sessionInfo.session.expires_at! * 1000).toLocaleString()}</p>
                  <p><strong>Expires In:</strong> {Math.round((sessionInfo.session.expires_at! * 1000 - Date.now()) / 1000 / 60)} minutes</p>
                </div>
              ) : (
                <p className="text-yellow-600">No session found</p>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Refresh Session Attempt */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Refresh Session Attempt</h2>
          {refreshAttempt ? (
            <div>
              {refreshAttempt.error ? (
                <div className="text-red-600">
                  <p><strong>Error:</strong> {refreshAttempt.error.message}</p>
                </div>
              ) : refreshAttempt.session ? (
                <div className="space-y-2">
                  <p className="text-green-600"><strong>✓ Session refreshed successfully</strong></p>
                  <p><strong>User Email:</strong> {refreshAttempt.session.user.email}</p>
                </div>
              ) : (
                <p className="text-yellow-600">No session to refresh</p>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* LocalStorage Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Supabase Data</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(localStorageData, null, 2)}</pre>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={handleManualLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Manual Login
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All & Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow p-6 mt-4">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-2">
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</p>
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
