import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Eye, Calendar, Link as LinkIcon, Move, Maximize, Save, X, ArrowUp, ArrowDown, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface ImageWindow {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
  active: boolean;
  page: string;
  created_at: string | null;
  updated_at: string | null;
}

interface ImageWindowFormData {
  title: string;
  image_url: string;
  link_url: string;
  position: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
  active: boolean;
  page: string;
}

function ClickableImageWindowManager() {
  const [imageWindows, setImageWindows] = useState<ImageWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingWindow, setEditingWindow] = useState<ImageWindow | null>(null);
  const [formData, setFormData] = useState<ImageWindowFormData>({
    title: '',
    image_url: '',
    link_url: '',
    position: {
      x: 0,
      y: 0,
      width: '400px',
      height: '300px',
      zIndex: 10
    },
    active: true,
    page: 'home'
  });
  const { user } = useAuth();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';
  const { t } = useTranslation();

  const pages = [
    { value: 'home', label: 'Page d\'accueil' },
    { value: 'catalog', label: 'Catalogue' },
    { value: 'calculator', label: 'Calculateur' },
    { value: 'dashboard', label: 'Tableau de bord' },
    { value: 'pricing', label: 'Abonnements' }
  ];

  useEffect(() => {
    fetchImageWindows();
  }, []);

  const fetchImageWindows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clickable_image_windows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImageWindows(data || []);
    } catch (err) {
      console.error('Error fetching image windows:', err);
      setError('Erreur lors du chargement des fenêtres image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const windowData = {
        ...formData
      };

      if (editingWindow) {
        const { error } = await supabase
          .from('clickable_image_windows')
          .update(windowData)
          .eq('id', editingWindow.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clickable_image_windows')
          .insert([windowData]);

        if (error) throw error;
      }

      await fetchImageWindows();
      setIsAdding(false);
      setEditingWindow(null);
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        position: {
          x: 0,
          y: 0,
          width: '400px',
          height: '300px',
          zIndex: 10
        },
        active: true,
        page: 'home'
      });
    } catch (err) {
      console.error('Error saving image window:', err);
      setError('Erreur lors de la sauvegarde de la fenêtre image');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fenêtre image ?')) return;

    try {
      const { error } = await supabase
        .from('clickable_image_windows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchImageWindows();
    } catch (err) {
      console.error('Error deleting image window:', err);
      setError('Erreur lors de la suppression de la fenêtre image');
    }
  };

  const handleEdit = (window: ImageWindow) => {
    setEditingWindow(window);
    setFormData({
      title: window.title,
      image_url: window.image_url,
      link_url: window.link_url,
      position: window.position,
      active: window.active,
      page: window.page
    });
    setIsAdding(true);
  };

  const handlePreview = (window: ImageWindow) => {
    // Check if it's an internal link (starts with /)
    if (window.link_url.startsWith('/')) {
      // Navigate to the internal route
      window.location.href = window.link_url;
    } else {
      // Open external link in a new tab
      window.open(window.link_url, '_blank');
    }
  };

  // Function to check if a URL is internal or external
  const isInternalLink = (url: string): boolean => {
    return url.startsWith('/');
  };

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-amber-800">
          Cette fonctionnalité est réservée à l'administrateur.
        </p>
      </div>
    );
  }

  if (loading) {
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
          <div className="bg-purple-100 p-2 rounded-lg">
            <ImageIcon className="w-6 h-6 text-purple-700" />
          </div>
          <h2 className="text-xl font-semibold text-purple-800">
            Gestion des Fenêtres Image Cliquables
          </h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une fenêtre
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="mb-6 bg-gray-50 p-6 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de l'image *
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="https://..."
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Entrez l'URL d'une image (jpg, png, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL du lien *
              </label>
              <input
                type="text"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="/page-interne ou https://site-externe.com"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Pour un lien interne, commencez par / (ex: /origine). Pour un lien externe, utilisez l'URL complète (ex: https://exemple.com)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page *
              </label>
              <select
                value={formData.page}
                onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                {pages.map(page => (
                  <option key={page.value} value={page.value}>
                    {page.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">Position et dimensions</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position X (px)
                  </label>
                  <input
                    type="number"
                    value={formData.position.x}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        x: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Y (px)
                  </label>
                  <input
                    type="number"
                    value={formData.position.y}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        y: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largeur
                  </label>
                  <input
                    type="text"
                    value={formData.position.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        width: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="400px, 50%, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hauteur
                  </label>
                  <input
                    type="text"
                    value={formData.position.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        height: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="300px, 50%, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Z-Index
                  </label>
                  <input
                    type="number"
                    value={formData.position.zIndex}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position,
                        zIndex: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Fenêtre active
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingWindow(null);
                  setFormData({
                    title: '',
                    image_url: '',
                    link_url: '',
                    position: {
                      x: 0,
                      y: 0,
                      width: '400px',
                      height: '300px',
                      zIndex: 10
                    },
                    active: true,
                    page: 'home'
                  });
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600"
              >
                {editingWindow ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Titre</th>
              <th className="px-4 py-2">Image</th>
              <th className="px-4 py-2">Lien</th>
              <th className="px-4 py-2">Page</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Position</th>
              <th className="px-4 py-2">Dimensions</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {imageWindows.map((window) => (
              <tr key={window.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{window.title}</td>
                <td className="px-4 py-2">
                  <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={window.image_url} 
                      alt={window.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1564415900645-55a35c0c6b92?auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 text-blue-600 max-w-xs truncate">
                    <LinkIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {isInternalLink(window.link_url) ? `(Interne) ${window.link_url}` : window.link_url}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  {pages.find(p => p.value === window.page)?.label || window.page}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    window.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {window.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <span>
                      X:{window.position.x}, Y:{window.position.y}, Z:{window.position.zIndex || 10}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <span>
                      {window.position.width} × {window.position.height}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(window)}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePreview(window)}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                      title="Prévisualiser"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(window.id)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {imageWindows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Aucune fenêtre image trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClickableImageWindowManager;
