import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, Edit2, Trash2, Plus, Database, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FlourImage {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface EnterpriseUser {
  id: string;
  email: string;
}

function ImageManager() {
  const [selectedTable, setSelectedTable] = useState<'flours' | 'flours_template' | 'private_flours'>('flours');
  const [selectedPrivateUserId, setSelectedPrivateUserId] = useState<string | null>(null);
  const [enterpriseUsers, setEnterpriseUsers] = useState<EnterpriseUser[]>([]);
  const [flours, setFlours] = useState<FlourImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<FlourImage | null>(null);
  const [editingFlour, setEditingFlour] = useState<FlourImage | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  useEffect(() => {
    if (isAdmin && selectedTable === 'private_flours') {
      fetchEnterpriseUsers();
    }
    fetchFlours();
  }, [selectedTable, selectedPrivateUserId, isAdmin]);

  const fetchEnterpriseUsers = async () => {
    try {
      setLoading(true);
      
      // First, get all users with enterprise subscriptions
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('login_id')
        .eq('tier', 'enterprise')
        .eq('active', true);
      
      if (subscriptionError) throw subscriptionError;
      
      if (!subscriptionData || subscriptionData.length === 0) {
        setEnterpriseUsers([]);
        return;
      }
      
      // Get user IDs from subscription data
      const userIds = subscriptionData.map(sub => sub.login_id);
      
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
      setEnterpriseUsers(userData || []);
    } catch (err) {
      console.error('Error fetching enterprise users:', err);
      setError('Erreur lors du chargement des utilisateurs Enterprise');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlours = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from(selectedTable)
        .select('id, category_id, name, description, image_url');

      // If private flours and a specific user is selected
      if (selectedTable === 'private_flours' && selectedPrivateUserId) {
        query = query.eq('user_id_private_flours', selectedPrivateUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFlours(data || []);
    } catch (err) {
      console.error('Error fetching flours:', err);
      setError('Erreur lors de la récupération des farines');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateImage = async (id: string, newUrl: string) => {
    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({ image_url: newUrl })
        .eq('id', id);

      if (error) throw error;
      await fetchFlours();
      setEditingFlour(null);
      setNewImageUrl('');
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Erreur lors de la mise à jour de l\'image');
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({ image_url: null })
        .eq('id', id);

      if (error) throw error;
      await fetchFlours();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Erreur lors de la suppression de l\'image');
    }
  };

  const getCatalogLabel = () => {
    switch (selectedTable) {
      case 'flours': return 'Catalogue Public';
      case 'flours_template': return 'Catalogue Enterprise';
      case 'private_flours': return 'Catalogue Privé';
      default: return 'Catalogue';
    }
  };

  if (loading && flours.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-lg">
            <ImageIcon className="w-6 h-6 text-green-700" />
          </div>
          <h2 className="text-xl font-semibold text-green-800">
            Gestion des Images
          </h2>
        </div>
        {isAdmin && (
          <div className="flex gap-4">
            <select
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value as 'flours' | 'flours_template' | 'private_flours');
                setSelectedPrivateUserId(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="flours">Catalogue Public</option>
              <option value="flours_template">Catalogue Enterprise</option>
              <option value="private_flours">Catalogue Privé</option>
            </select>
            
            {selectedTable === 'private_flours' && (
              <select
                value={selectedPrivateUserId || ''}
                onChange={(e) => setSelectedPrivateUserId(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tous les utilisateurs</option>
                {enterpriseUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
        <p className="font-medium">Catalogue actuel: {getCatalogLabel()}</p>
        {selectedTable === 'private_flours' && selectedPrivateUserId && (
          <p className="text-sm mt-1">
            Utilisateur: {enterpriseUsers.find(u => u.id === selectedPrivateUserId)?.email || selectedPrivateUserId}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Image URL</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {flours.map((flour) => (
              <tr key={flour.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{flour.name}</td>
                <td className="px-4 py-2">{flour.description || '-'}</td>
                <td className="px-4 py-2">
                  {editingFlour?.id === flour.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Nouvelle URL de l'image"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => handleUpdateImage(flour.id, newImageUrl)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditingFlour(null)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <span className="truncate block max-w-xs">
                      {flour.image_url || 'Aucune image'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewImage(flour)}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Voir l'image"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingFlour(flour);
                        setNewImageUrl(flour.image_url || '');
                      }}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                      title="Modifier l'URL"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {flour.image_url && (
                      <button
                        onClick={() => handleDeleteImage(flour.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Supprimer l'image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {!flour.image_url && (
                      <button
                        onClick={() => {
                          setEditingFlour(flour);
                          setNewImageUrl('');
                        }}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                        title="Ajouter une image"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {flours.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Aucune farine trouvée dans ce catalogue
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de visualisation d'image */}
      {viewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-green-800">
                  {viewImage.name}
                </h3>
                <button
                  onClick={() => setViewImage(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
              {viewImage.image_url ? (
                <div className="relative aspect-video">
                  <img
                    src={viewImage.image_url}
                    alt={viewImage.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                  Aucune image disponible
                </div>
              )}
              <div className="mt-4">
                <p className="text-sm text-gray-600">{viewImage.description || 'Aucune description'}</p>
                {viewImage.image_url && (
                  <p className="mt-2 text-sm text-gray-500 break-all">
                    URL: {viewImage.image_url}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageManager;
