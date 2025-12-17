import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Calendar, 
  CreditCard,
  Plus,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MixBonusPaymentModal from './MixBonusPaymentModal';

interface MixBonus {
  id: string;
  user_id: string;
  quantity: number;
  amount_paid: number;
  purchase_date: string;
  expiration_date: string;
  is_active: boolean;
}

function MixBonusManager() {
  const [bonuses, setBonuses] = useState<MixBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBonuses();
    }
  }, [user]);

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('mix_bonus_purchases')
        .select('*')
        .eq('user_id', user?.id)
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      
      setBonuses(data || []);
    } catch (err) {
      console.error('Error fetching mix bonuses:', err);
      setError('Error loading mix bonuses');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBonuses();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this bonus pack?')) return;
    
    try {
      const { error } = await supabase
        .from('mix_bonus_purchases')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setBonuses(bonuses.map(bonus => 
        bonus.id === id ? { ...bonus, is_active: false } : bonus
      ));
      
      setSuccess('Bonus pack deactivated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deactivating bonus pack:', err);
      setError('Error deactivating bonus pack');
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchBonuses(); // Refresh the list
  };

  const getTotalActiveBonusSlots = () => {
    return bonuses
      .filter(bonus => bonus.is_active && new Date(bonus.expiration_date) > new Date())
      .reduce((total, bonus) => total + bonus.quantity, 0);
  };


  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-green-800">
          Mes Packs Bonus de Mixes
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Acheter un pack bonus
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            disabled={refreshing}
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
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
          <h3 className="font-semibold">Résumé de vos packs bonus</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Emplacements bonus actifs</span>
              <span className="text-2xl font-bold text-blue-700">{getTotalActiveBonusSlots()}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Packs actifs</span>
              <span className="text-2xl font-bold text-blue-700">
                {bonuses.filter(b => b.is_active && new Date(b.expiration_date) > new Date()).length}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Packs expirés</span>
              <span className="text-2xl font-bold text-gray-500">
                {bonuses.filter(b => !b.is_active || new Date(b.expiration_date) <= new Date()).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bonus Packs List */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Date d'achat</th>
              <th className="px-4 py-2">Quantité</th>
              <th className="px-4 py-2">Montant payé</th>
              <th className="px-4 py-2">Expiration</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                  </div>
                </td>
              </tr>
            ) : bonuses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Vous n'avez pas encore acheté de pack bonus. Cliquez sur "Acheter un pack bonus" pour commencer.
                </td>
              </tr>
            ) : (
              bonuses.map((bonus) => {
                const isExpired = new Date(bonus.expiration_date) <= new Date();
                const isActive = bonus.is_active && !isExpired;
                
                return (
                  <tr key={bonus.id} className={`hover:bg-gray-50 ${!isActive ? 'bg-gray-50 text-gray-500' : ''}`}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(bonus.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {bonus.quantity} emplacements
                    </td>
                    <td className="px-4 py-2">
                      {bonus.amount_paid}€
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(bonus.expiration_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actif
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Expiré
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Désactivé
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isActive && (
                        <button
                          onClick={() => handleDelete(bonus.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Désactiver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showPaymentModal && (
        <MixBonusPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default MixBonusManager;
