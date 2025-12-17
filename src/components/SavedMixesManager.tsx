import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Edit2, 
  Trash2, 
  Eye, 
  Filter, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Settings, 
  Save, 
  X, 
  Users, 
  CreditCard,
  Tag,
  Download,
  Upload
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SavedMix } from '../types/mix';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  subscription_tier: string;
}

interface MixLimit {
  id: string;
  tier: string;
  max_mixes: number;
}

function SavedMixesManager() {
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showLimitsSettings, setShowLimitsSettings] = useState(false);
  const [mixLimits, setMixLimits] = useState<{[key: string]: number}>({
    pro: 1,
    enterprise: 20
  });
  const [editingLimits, setEditingLimits] = useState<{[key: string]: number}>({
    pro: 1,
    enterprise: 20
  });
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  useEffect(() => {
    if (isAdmin) {
      fetchMixes();
      fetchUsers();
      fetchMixLimits();
    }
  }, [isAdmin, selectedUser, selectedSubscription]);

  const fetchMixLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('mix_limits')
        .select('*')
        .order('max_mixes', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const limitsObj: {[key: string]: number} = {};
        data.forEach((limit: MixLimit) => {
          limitsObj[limit.tier] = limit.max_mixes;
        });
        
        setMixLimits(limitsObj);
        setEditingLimits(limitsObj);
      }
    } catch (err) {
      console.error('Error fetching mix limits:', err);
      setError('Error loading mix limits');
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch users with their subscription information
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('login_id, tier')
        .order('created_at', { ascending: false });
      
      if (subscriptionsError) throw subscriptionsError;
      
      if (!subscriptionsData || subscriptionsData.length === 0) {
        setUsers([]);
        return;
      }
      
      // Get user IDs from subscription data
      const userIds = subscriptionsData.map(sub => sub.login_id);
      
      // Fetch user emails using the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user emails');
      }
      
      const userData = await response.json();
      
      // Combine subscription data with user data
      const usersWithSubscriptions = userData.map((user: any) => {
        const subscription = subscriptionsData.find(sub => sub.login_id === user.id);
        return {
          id: user.id,
          email: user.email,
          subscription_tier: subscription?.tier || 'free'
        };
      });
      
      setUsers(usersWithSubscriptions);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error loading users');
    }
  };

  const fetchMixes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('saved_mixes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (selectedUser) {
        query = query.eq('user_id', selectedUser);
      }
      
      if (selectedSubscription) {
        // This requires a join with the subscriptions table
        // For simplicity, we'll filter client-side after fetching
        // In a real implementation, this would be done in the database
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let filteredMixes = data || [];
      
      // If subscription filter is applied, filter client-side
      if (selectedSubscription && users.length > 0) {
        const userIdsWithSubscription = users
          .filter(u => u.subscription_tier === selectedSubscription)
          .map(u => u.id);
        
        filteredMixes = filteredMixes.filter(mix => 
          userIdsWithSubscription.includes(mix.user_id)
        );
      }
      
      // Apply search filter
      if (searchTerm) {
        filteredMixes = filteredMixes.filter(mix => 
          mix.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (mix.description && mix.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (mix.tags && mix.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        );
      }
      
      setMixes(filteredMixes);
    } catch (err) {
      console.error('Error fetching mixes:', err);
      setError('Error loading saved mixes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMixes();
    await fetchUsers();
    await fetchMixLimits();
    setRefreshing(false);
  };

  const handleDelete = async (mixId: string) => {
    if (!confirm('Are you sure you want to delete this mix?')) return;
    
    try {
      const { error } = await supabase
        .from('saved_mixes')
        .delete()
        .eq('id', mixId);
      
      if (error) throw error;
      
      setMixes(mixes.filter(mix => mix.id !== mixId));
      setSuccess('Mix deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting mix:', err);
      setError('Error deleting mix');
    }
  };

  const handleView = (mix: SavedMix) => {
    navigate('/calculator', { 
      state: { 
        mix,
        mode: 'view'
      }
    });
  };

  const handleEdit = (mix: SavedMix) => {
    navigate('/calculator', { 
      state: { 
        mix,
        mode: 'edit'
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMixes();
  };

  const handleSaveLimits = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      // Update the mix_limits table
      const updates = Object.entries(editingLimits).map(([tier, max_mixes]) => ({
        tier,
        max_mixes
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from('mix_limits')
          .update({ max_mixes: update.max_mixes })
          .eq('tier', update.tier);
        
        if (error) throw error;
      }
      
      setMixLimits(editingLimits);
      setShowLimitsSettings(false);
      setSuccess('Mix limits updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving mix limits:', err);
      setError('Error saving mix limits');
    }
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'Unknown';
  };

  const getUserSubscription = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.subscription_tier : 'Unknown';
  };

  const countUserMixes = (userId: string) => {
    return mixes.filter(mix => mix.user_id === userId).length;
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'free':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportMixesCSV = () => {
    if (mixes.length === 0) return;
    
    const headers = [
      'ID',
      'User ID',
      'Name',
      'Description',
      'Composition',
      'Created At',
      'Updated At',
      'Tags'
    ].join(',');
    
    const rows = mixes.map(mix => [
      mix.id,
      mix.user_id,
      `"${mix.name}"`,
      `"${mix.description || ''}"`,
      `"${JSON.stringify(mix.composition).replace(/"/g, '""')}"`,
      mix.created_at,
      mix.updated_at,
      `"${JSON.stringify(mix.tags || []).replace(/"/g, '""')}"`
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'saved_mixes_export.csv';
    link.click();
  };

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-amber-800">
          This feature is only available to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-lg">
            <Users className="w-6 h-6 text-green-700" />
          </div>
          <h2 className="text-xl font-semibold text-green-800">
            Gestion des Mixes Sauvegardés
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLimitsSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurer les limites
          </button>
          <button
            onClick={exportMixesCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
            disabled={mixes.length === 0}
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <CreditCard className="w-5 h-5" />
          <h3 className="font-semibold">Limites de sauvegarde actuelles</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Pro
                </span>
                <p className="mt-1 text-sm text-gray-600">Limite de mixes sauvegardés</p>
              </div>
              <span className="text-2xl font-bold text-blue-700">{mixLimits.pro}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Enterprise
                </span>
                <p className="mt-1 text-sm text-gray-600">Limite de mixes sauvegardés</p>
              </div>
              <span className="text-2xl font-bold text-purple-700">{mixLimits.enterprise}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un mix..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedSubscription || ''}
            onChange={(e) => setSelectedSubscription(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Tous les abonnements</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Tous les utilisateurs</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.email} ({user.subscription_tier})
              </option>
            ))}
          </select>
          <button 
            type="submit"
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            disabled={refreshing}
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Utilisateur</th>
              <th className="px-4 py-2">Abonnement</th>
              <th className="px-4 py-2">Mixes Utilisés</th>
              <th className="px-4 py-2">Créé le</th>
              <th className="px-4 py-2">Tags</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                  </div>
                </td>
              </tr>
            ) : mixes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm || selectedUser || selectedSubscription ? 'Aucun résultat trouvé' : 'Aucun mix sauvegardé'}
                </td>
              </tr>
            ) : (
              mixes.map((mix) => {
                const userEmail = getUserEmail(mix.user_id);
                const userSubscription = getUserSubscription(mix.user_id);
                const mixCount = countUserMixes(mix.user_id);
                const mixLimit = userSubscription === 'pro' ? mixLimits.pro : 
                                userSubscription === 'enterprise' ? mixLimits.enterprise : 0;
                const isOverLimit = mixLimit > 0 && mixCount > mixLimit;
                
                return (
                  <tr key={mix.id} className={`hover:bg-gray-50 ${isOverLimit ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-2 font-medium">{mix.name}</td>
                    <td className="px-4 py-2">{userEmail}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(userSubscription)}`}>
                        {userSubscription}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-medium ${isOverLimit ? 'text-red-600' : ''}`}>
                        {mixCount} / {mixLimit > 0 ? mixLimit : '∞'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(mix.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {mix.tags && mix.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {(!mix.tags || mix.tags.length === 0) && (
                          <span className="text-gray-400">Aucun tag</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(mix)}
                          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Lecture"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(mix)}
                          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                          title="Editer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mix.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Total: {mixes.length} mixes sauvegardés
      </div>

      {/* Mix Limits Settings Modal */}
      {showLimitsSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-green-800">
                  Configurer les limites de mixes
                </h3>
                <button
                  onClick={() => setShowLimitsSettings(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite pour les abonnements Pro
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingLimits.pro}
                    onChange={(e) => setEditingLimits({
                      ...editingLimits,
                      pro: parseInt(e.target.value) || 1
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nombre maximum de mixes que les utilisateurs Pro peuvent sauvegarder
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite pour les abonnements Enterprise
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingLimits.enterprise}
                    onChange={(e) => setEditingLimits({
                      ...editingLimits,
                      enterprise: parseInt(e.target.value) || 1
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nombre maximum de mixes que les utilisateurs Enterprise peuvent sauvegarder
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowLimitsSettings(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveLimits}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavedMixesManager;
