import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function VerifyRecovery() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification du lien de réinitialisation...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyRecoveryToken = async () => {
      try {
        console.log('🔄 VerifyRecovery: Starting');
        console.log('Full URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Hash:', window.location.hash);

        // Try to get all possible token formats
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = searchParams.get('token') || hashParams.get('token');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const type = searchParams.get('type') || hashParams.get('type');

        console.log('Found params:', {
          token: !!token,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          tokenHash: !!tokenHash,
          type
        });

        // If we have hash-based tokens, use them directly
        if (accessToken && refreshToken) {
          console.log('✅ Using hash-based tokens');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) throw error;

          setStatus('success');
          setMessage('Lien vérifié avec succès!');
          setTimeout(() => navigate('/reset-password', { replace: true }), 1000);
          return;
        }

        // Try to verify OTP token
        if (token || tokenHash) {
          console.log('🔄 Verifying OTP token...');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token!,
            type: 'recovery'
          });

          if (error) {
            console.error('❌ OTP verification error:', error);
            throw error;
          }

          if (data.session) {
            console.log('✅ Session created from OTP');
            setStatus('success');
            setMessage('Lien vérifié avec succès!');
            setTimeout(() => navigate('/reset-password', { replace: true }), 1000);
            return;
          }
        }

        // Check if we already have a session (from server-side redirect)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ Found existing session');
          setStatus('success');
          setMessage('Session trouvée!');
          setTimeout(() => navigate('/reset-password', { replace: true }), 1000);
          return;
        }

        throw new Error('Aucun token valide trouvé dans l\'URL');

      } catch (error) {
        console.error('❌ Verification error:', error);
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Erreur de vérification';
        setMessage(errorMessage);

        setTimeout(() => {
          navigate('/auth', {
            state: {
              error: 'Le lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.'
            },
            replace: true
          });
        }, 3000);
      }
    };

    verifyRecoveryToken();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        )}
        {status === 'error' && (
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'loading' && 'Vérification'}
          {status === 'success' && 'Succès!'}
          {status === 'error' && 'Erreur'}
        </h2>
        <p className="text-gray-600">{message}</p>

        {status === 'error' && (
          <p className="text-sm text-gray-500 mt-4">
            Redirection vers la page de connexion...
          </p>
        )}
      </div>
    </div>
  );
}

export default VerifyRecovery;
