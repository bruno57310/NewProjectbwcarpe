import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';

interface SubscriptionData {
  id: string;
  login_id: string;
  tier: string;
  active: boolean;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

function SubscriptionDebug() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('login_id', user.id)
        .maybeSingle();

      if (fetchError) {
        setError(`Erreur lors de la récupération: ${fetchError.message}`);
      } else {
        setSubscription(data);
      }
    } catch (err) {
      setError(`Erreur: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const createDefaultSubscription = async () => {
    if (!user) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const now = new Date();
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const { data, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          login_id: user.id,
          tier: 'free',
          active: true,
          current_period_start: now.toISOString(),
          current_period_end: oneYearLater.toISOString(),
          cancel_at_period_end: false
        })
        .select()
        .single();

      if (insertError) {
        setError(`Erreur lors de la création: ${insertError.message}`);
      } else {
        setSubscription(data);
        setSuccess('Subscription créée avec succès!');
      }
    } catch (err) {
      setError(`Erreur: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const updateToEnterprise = async () => {
    if (!user || !subscription) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: updateError } = await supabase
        .from('subscriptions')
        .update({ tier: 'enterprise' })
        .eq('login_id', user.id)
        .select()
        .single();

      if (updateError) {
        setError(`Erreur lors de la mise à jour: ${updateError.message}`);
      } else {
        setSubscription(data);
        setSuccess('Subscription mise à jour vers Enterprise!');
      }
    } catch (err) {
      setError(`Erreur: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-600">Vous devez être connecté pour voir cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Database className="w-8 h-8" />
              Subscription Debug
            </h1>
            <button
              onClick={fetchSubscription}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-green-800">{success}</div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Informations Utilisateur</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="text-gray-800">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">User ID:</span>
                  <span className="text-gray-800 font-mono text-sm">{user.id}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Configuration Environment</h2>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-medium text-gray-600 flex-shrink-0">VITE_SUPABASE_URL:</span>
                  <span className="text-gray-800 font-mono text-sm break-all text-right">
                    {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="font-medium text-gray-600 flex-shrink-0">VITE_SUPABASE_ANON_KEY:</span>
                  <span className="text-gray-800 font-mono text-sm">
                    {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">État de la Subscription</h2>

              {loading ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Chargement...</p>
                </div>
              ) : subscription ? (
                <div className="bg-green-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Subscription trouvée</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-gray-600">ID:</span>
                      <span className="text-gray-800 ml-2 font-mono text-sm">{subscription.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tier:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                        subscription.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        subscription.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription.tier}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Active:</span>
                      <span className="ml-2">{subscription.active ? '✅ Oui' : '❌ Non'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Cancel at period end:</span>
                      <span className="ml-2">{subscription.cancel_at_period_end ? '✅ Oui' : '❌ Non'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Période:</span>
                      <div className="text-gray-800 text-sm mt-1">
                        <div>Début: {new Date(subscription.current_period_start).toLocaleString('fr-FR')}</div>
                        <div>Fin: {new Date(subscription.current_period_end).toLocaleString('fr-FR')}</div>
                      </div>
                    </div>
                  </div>

                  {subscription.tier !== 'enterprise' && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <button
                        onClick={updateToEnterprise}
                        disabled={creating}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium"
                      >
                        {creating ? 'Mise à jour...' : 'Passer en Enterprise'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">Aucune subscription trouvée</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Cet utilisateur n'a pas de subscription dans la base de données.
                    Cliquez sur le bouton ci-dessous pour créer une subscription par défaut.
                  </p>
                  <button
                    onClick={createDefaultSubscription}
                    disabled={creating}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                  >
                    {creating ? 'Création en cours...' : 'Créer une Subscription Free par défaut'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionDebug;
