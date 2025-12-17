import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, Edit2, Trash2, X, Save, Tag } from 'lucide-react';
import type { Subscription } from '../types/subscription';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionManagerProps {
  onClose?: () => void;
}

interface EditModalProps {
  subscription: Subscription;
  onClose: () => void;
  onSave: (subscription: Subscription) => Promise<void>;
}

function EditModal({ subscription, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState(subscription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error('Error saving subscription:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-green-800">Modifier l'abonnement</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'abonnement</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="free">Gratuit</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Actif</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin de période
              </label>
              <input
                type="date"
                value={new Date(formData.current_period_end).toISOString().split('T')[0]}
                onChange={(e) => setFormData({
                  ...formData,
                  current_period_end: new Date(e.target.value).toISOString()
                })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubscriptionManager({ onClose }: SubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  useEffect(() => {
    fetchSubscriptions();
  }, [isAdmin]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If user is admin, fetch all subscriptions
      // Otherwise, fetch only the user's subscription
      const query = supabase
        .from('subscriptions')
        .select('*');
      
      if (!isAdmin) {
        query.eq('login_id', user?.id);
      }
      
      query.order('created_at', { ascending: false });
      
      const { data: subscriptionsData, error: subscriptionsError } = await query;

      if (subscriptionsError) throw subscriptionsError;

      // Get user emails through the edge function only if admin and there are subscriptions
      if (isAdmin && subscriptionsData && subscriptionsData.length > 0) {
        const userIds = subscriptionsData.map(sub => sub.login_id);
        
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-emails`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const userEmails = await response.json();

          if (userEmails.error) {
            throw new Error(userEmails.error);
          }

          // Map the emails to their corresponding subscriptions
          const enrichedSubscriptions = subscriptionsData.map(subscription => ({
            ...subscription,
            userEmail: userEmails.find((u: any) => u.id === subscription.login_id)?.email || 'Email non disponible'
          }));

          setSubscriptions(enrichedSubscriptions);
        } catch (emailError) {
          console.error('Error fetching user emails:', emailError);
          // Still set the subscriptions even if email fetch fails
          setSubscriptions(subscriptionsData.map(subscription => ({
            ...subscription,
            userEmail: 'Email non disponible'
          })));
        }
      } else {
        // For non-admin users or if no subscriptions
        setSubscriptions(subscriptionsData || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Erreur lors du chargement des abonnements');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subscription: Subscription) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);

      if (error) throw error;
      await fetchSubscriptions();
    } catch (err) {
      console.error('Error deleting subscription:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const handleSave = async (updatedSubscription: Subscription) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          tier: updatedSubscription.tier,
          active: updatedSubscription.active,
          current_period_end: updatedSubscription.current_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedSubscription.id);

      if (error) throw error;
      await fetchSubscriptions();
    } catch (err) {
      console.error('Error updating subscription:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Utilisateur</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Fin de période</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscriptions.map(subscription => (
              <tr key={subscription.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{(subscription as any).userEmail || user?.email || 'Utilisateur actuel'}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subscription.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    subscription.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {subscription.tier}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subscription.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {subscription.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSubscription(subscription)}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingSubscription(subscription)}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(subscription)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Aucun abonnement trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-green-800">Détails de l'abonnement</h3>
              <button
                onClick={() => setSelectedSubscription(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Utilisateur</p>
                <p className="font-medium">{(selectedSubscription as any).userEmail || user?.email || 'Utilisateur actuel'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type d'abonnement</p>
                <p className="font-medium capitalize">{selectedSubscription.tier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <p className="font-medium">{selectedSubscription.active ? 'Actif' : 'Inactif'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Début de période</p>
                <p className="font-medium">
                  {new Date(selectedSubscription.current_period_start).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fin de période</p>
                <p className="font-medium">
                  {new Date(selectedSubscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Créé le</p>
                <p className="font-medium">
                  {new Date(selectedSubscription.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSubscription(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubscription && (
        <EditModal
          subscription={editingSubscription}
          onClose={() => setEditingSubscription(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default SubscriptionManager;
