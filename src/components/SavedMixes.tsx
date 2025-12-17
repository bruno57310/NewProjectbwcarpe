import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Edit2, Eye, Save, Trash2, Tag, AlertCircle, RefreshCw, Share2, Check } from 'lucide-react';
import type { SavedMix } from '../types/mix';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SavedMixesProps {
  onSelectMix?: (mix: SavedMix) => void;
  onEditMix?: (mix: SavedMix) => void;
  showActions?: boolean;
}

function SavedMixes({ onSelectMix, onEditMix, showActions = true }: SavedMixesProps) {
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharedStates, setSharedStates] = useState<Record<string, boolean>>({});
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    fetchMixes();
  }, [user]);

  const fetchMixes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching mixes for user:', user.id);
      
      const { data, error } = await supabase
        .from('saved_mixes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Fetched mixes:', data);
      setMixes(data || []);
      
      // Initialize shared states from the database
      const initialSharedStates: Record<string, boolean> = {};
      (data || []).forEach(mix => {
        initialSharedStates[mix.id] = mix.shared || false;
      });
      setSharedStates(initialSharedStates);
    } catch (err) {
      console.error('Error fetching saved mixes:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMixes();
    setRefreshing(false);
  };

  const handleSharedToggle = (mixId: string) => {
    setSharedStates(prev => ({
      ...prev,
      [mixId]: !prev[mixId]
    }));
  };

  const handleUpdateSharedMixes = async () => {
    if (!user) return;
    
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);
      
      // First, update the shared column in saved_mixes table for each mix
      for (const [mixId, isShared] of Object.entries(sharedStates)) {
        const { error: updateError } = await supabase
          .from('saved_mixes')
          .update({ shared: isShared })
          .eq('id', mixId)
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      }
      
      // Then clean the saved_mixes_shared table
      const { error: cleanError } = await supabase.rpc('clean_saved_mixes_shared');
      if (cleanError) throw cleanError;
      
      // Finally, sync the shared mixes
      const { error: syncError } = await supabase.rpc('sync_saved_mixes_shared');
      if (syncError) throw syncError;
      
      setSuccess('Mixes partagés mis à jour avec succès');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating shared mixes:', err);
      setError('Erreur lors de la mise à jour des mixes partagés');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (mixId: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('saved_mixes')
        .delete()
        .eq('id', mixId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setMixes(mixes.filter(mix => mix.id !== mixId));
      
      // Remove from shared states
      setSharedStates(prev => {
        const newStates = { ...prev };
        delete newStates[mixId];
        return newStates;
      });
    } catch (err) {
      console.error('Error deleting mix:', err);
      setError(t('common.error'));
    }
  };

  const handleView = (mix: SavedMix) => {
    if (onSelectMix) {
      onSelectMix(mix);
    } else {
      navigate('/calculator', { 
        state: { 
          mix,
          mode: 'view'
        }
      });
    }
  };

  const handleEdit = (mix: SavedMix) => {
    if (onEditMix) {
      onEditMix(mix);
    } else {
      navigate('/calculator', { 
        state: { 
          mix,
          editMode: true,
          mode: 'edit'
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-medium">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm flex items-center gap-1 text-red-600 hover:text-red-800"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (mixes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t('calculator.savedMixes.empty')}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <div className="mt-4 text-sm text-gray-400">
          <p>If you've created mixes but don't see them here, try refreshing or check the <a href="/saved-mixes-debug" className="text-blue-500 hover:underline">debug page</a>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-green-800">
          {mixes.length} {mixes.length === 1 ? 'Mix' : 'Mixes'} Found
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdateSharedMixes}
            disabled={updating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Update saved_mixes_shared
              </>
            )}
          </button>
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1 text-sm"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}
      
      {mixes.map(mix => (
        <div
          key={mix.id}
          className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharedStates[mix.id] || false}
                    onChange={() => handleSharedToggle(mix.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Partager ce mix
                  </span>
                </label>
              </div>
              <h3 className="text-lg font-semibold text-green-800">{mix.name}</h3>
              {mix.description && (
                <p className="text-gray-600 mt-1">{mix.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {mix.composition.map(item => (
                  <div
                    key={item.flourId}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    <span>{item.flourName}: {item.percentage}%</span>
                    {item.source && (
                      <span className="text-xs bg-green-200 px-1 rounded">
                        {item.source === 'enterprise' ? 'E' : item.source === 'private' ? 'P' : 'Pub'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {mix.tags && mix.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {mix.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {showActions && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleView(mix)}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  title={t('common.view')}
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(mix)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t('common.edit')}
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(mix.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {t('common.created')}: {new Date(mix.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SavedMixes;
