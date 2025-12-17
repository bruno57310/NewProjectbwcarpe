import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Eye, Calendar, Link as LinkIcon, Move, Maximize, Save, X, ArrowUp, ArrowDown, Type, Layout, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import TranslationEditor from './TranslationEditor';

interface TextWindow {
  id: string;
  title: string;
  content: string | null;
  position: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
  background_color: string;
  text_color: string;
  title_background_color: string;
  title_text_color: string;
  border_style: {
    width: string;
    style: string;
    color: string;
    radius: string;
  };
  active: boolean;
  page: string;
  created_at: string | null;
  updated_at: string | null;
}

interface TextWindowFormData {
  title: string;
  content: string;
  position: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
  background_color: string;
  text_color: string;
  title_background_color: string;
  title_text_color: string;
  border_style: {
    width: string;
    style: string;
    color: string;
    radius: string;
  };
  active: boolean;
  page: string;
}

function TextWindowManager() {
  const [textWindows, setTextWindows] = useState<TextWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingWindow, setEditingWindow] = useState<TextWindow | null>(null);
  const [showTranslationEditor, setShowTranslationEditor] = useState(false);
  const [selectedTranslationKey, setSelectedTranslationKey] = useState('');
  const [formData, setFormData] = useState<TextWindowFormData>({
    title: '',
    content: '',
    position: {
      x: 0,
      y: 0,
      width: '400px',
      height: 'auto',
      zIndex: 10
    },
    background_color: '#ffffff',
    text_color: '#000000',
    title_background_color: '#ffffff',
    title_text_color: '#000000',
    border_style: {
      width: '1px',
      style: 'solid',
      color: '#e5e7eb',
      radius: '0.5rem'
    },
    active: true,
    page: 'home'
  });
  const { user } = useAuth();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';
  const { t } = useTranslation();

  const pages = [
    { value: 'home', label: t('textWindow.placements.home') },
    { value: 'catalog', label: t('textWindow.placements.catalog') },
    { value: 'calculator', label: t('textWindow.placements.calculator') },
    { value: 'calculator/combine', label: 'Mix Combiner' },
    { value: 'dashboard', label: t('textWindow.placements.dashboard') }
  ];

  useEffect(() => {
    fetchTextWindows();
  }, []);

  const fetchTextWindows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('text_windows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTextWindows(data || []);
    } catch (err) {
      console.error('Error fetching text windows:', err);
      setError('Erreur lors du chargement des fenêtres texte');
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
          .from('text_windows')
          .update(windowData)
          .eq('id', editingWindow.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('text_windows')
          .insert([windowData]);

        if (error) throw error;
      }

      await fetchTextWindows();
      setIsAdding(false);
      setEditingWindow(null);
      setFormData({
        title: '',
        content: '',
        position: {
          x: 0,
          y: 0,
          width: '400px',
          height: 'auto',
          zIndex: 10
        },
        background_color: '#ffffff',
        text_color: '#000000',
        title_background_color: '#ffffff',
        title_text_color: '#000000',
        border_style: {
          width: '1px',
          style: 'solid',
          color: '#e5e7eb',
          radius: '0.5rem'
        },
        active: true,
        page: 'home'
      });
    } catch (err) {
      console.error('Error saving text window:', err);
      setError('Erreur lors de la sauvegarde de la fenêtre texte');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fenêtre texte ?')) return;

    try {
      const { error } = await supabase
        .from('text_windows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTextWindows();
    } catch (err) {
      console.error('Error deleting text window:', err);
      setError('Erreur lors de la suppression de la fenêtre texte');
    }
  };

  const handleEdit = (window: TextWindow) => {
    setEditingWindow(window);
    setFormData({
      title: window.title,
      content: window.content || '',
      position: window.position,
      background_color: window.background_color,
      text_color: window.text_color,
      title_background_color: window.title_background_color || window.background_color,
      title_text_color: window.title_text_color || window.text_color,
      border_style: window.border_style,
      active: window.active,
      page: window.page
    });
    setIsAdding(true);
  };

  const handlePreviewTranslation = () => {
    // Get the current title and content
    const title = formData.title;
    const content = formData.content;
    
    // Try to translate them using the t function
    try {
      // Extract keys from the title and content
      const titleKeys = title.match(/\{\{([^}]+)\}\}/g) || [];
      const contentKeys = content.match(/\{\{([^}]+)\}\}/g) || [];
      
      // Create a preview message
      let previewMessage = "Translation Preview:\n\n";
      
      // Add title translations
      if (titleKeys.length > 0) {
        previewMessage += "Title Keys:\n";
        titleKeys.forEach(key => {
          const cleanKey = key.replace(/\{\{|\}\}/g, '').trim();
          const translation = t(cleanKey);
          previewMessage += `${key} => ${translation === cleanKey ? 'NOT FOUND' : translation}\n`;
        });
      } else {
        previewMessage += "No translation keys found in title.\n";
      }
      
      // Add content translations
      if (contentKeys.length > 0) {
        previewMessage += "\nContent Keys:\n";
        contentKeys.forEach(key => {
          const cleanKey = key.replace(/\{\{|\}\}/g, '').trim();
          const translation = t(cleanKey);
          previewMessage += `${key} => ${translation === cleanKey ? 'NOT FOUND' : translation}\n`;
        });
      } else {
        previewMessage += "\nNo translation keys found in content.\n";
      }
      
      // Show the preview
      alert(previewMessage);
    } catch (err) {
      console.error('Error previewing translations:', err);
      alert('Error previewing translations. See console for details.');
    }
  };

  const openTranslationEditor = () => {
    // Extract the first translation key from title or content
    const titleMatch = formData.title.match(/\{\{([^}]+)\}\}/);
    const contentMatch = formData.content.match(/\{\{([^}]+)\}\}/);
    
    const key = titleMatch ? titleMatch[1].trim() : contentMatch ? contentMatch[1].trim() : '';
    
    setSelectedTranslationKey(key);
    setShowTranslationEditor(true);
  };

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-amber-800">
          {t('textWindow.adminOnly')}
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
        <h2 className="text-xl font-semibold text-green-800">
          {t('textWindow.management')}
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('textWindow.addWindow')}
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
                {t('textWindow.title')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('textWindow.translationTip')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('textWindow.content')}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={5}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('textWindow.contentTip')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('textWindow.page')} *
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
              <h3 className="text-md font-medium text-gray-700 mb-3">{t('textWindow.titleColors')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.titleBackgroundColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.title_background_color}
                      onChange={(e) => setFormData({ ...formData, title_background_color: e.target.value })}
                      className="w-10 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.title_background_color}
                      onChange={(e) => setFormData({ ...formData, title_background_color: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.titleTextColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.title_text_color}
                      onChange={(e) => setFormData({ ...formData, title_text_color: e.target.value })}
                      className="w-10 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.title_text_color}
                      onChange={(e) => setFormData({ ...formData, title_text_color: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">{t('textWindow.contentColors')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.contentBackgroundColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-10 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.contentTextColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-10 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">{t('textWindow.positionAndDimensions')}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.positionX')}
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
                    {t('textWindow.positionY')}
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
                    {t('textWindow.width')}
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
                    {t('textWindow.height')}
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
                    placeholder="auto, 300px, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.zIndex')}
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
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">{t('textWindow.borderStyle')}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.borderWidth')}
                  </label>
                  <input
                    type="text"
                    value={formData.border_style.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      border_style: {
                        ...formData.border_style,
                        width: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="1px, 2px, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.borderStyle')}
                  </label>
                  <select
                    value={formData.border_style.style}
                    onChange={(e) => setFormData({
                      ...formData,
                      border_style: {
                        ...formData.border_style,
                        style: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                    <option value="none">None</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.borderColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.border_style.color}
                      onChange={(e) => setFormData({
                        ...formData,
                        border_style: {
                          ...formData.border_style,
                          color: e.target.value
                        }
                      })}
                      className="w-10 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.border_style.color}
                      onChange={(e) => setFormData({
                        ...formData,
                        border_style: {
                          ...formData.border_style,
                          color: e.target.value
                        }
                      })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.borderRadius')}
                  </label>
                  <input
                    type="text"
                    value={formData.border_style.radius}
                    onChange={(e) => setFormData({
                      ...formData,
                      border_style: {
                        ...formData.border_style,
                        radius: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="0.5rem, 8px, etc."
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
                {t('textWindow.active')}
              </label>
            </div>

            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={handlePreviewTranslation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Preview Translations
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingWindow(null);
                    setFormData({
                      title: '',
                      content: '',
                      position: {
                        x: 0,
                        y: 0,
                        width: '400px',
                        height: 'auto',
                        zIndex: 10
                      },
                      background_color: '#ffffff',
                      text_color: '#000000',
                      title_background_color: '#ffffff',
                      title_text_color: '#000000',
                      border_style: {
                        width: '1px',
                        style: 'solid',
                        color: '#e5e7eb',
                        radius: '0.5rem'
                      },
                      active: true,
                      page: 'home'
                    });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600"
                >
                  {editingWindow ? t('common.update') : t('common.create')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">{t('textWindow.title')}</th>
              <th className="px-4 py-2">{t('textWindow.page')}</th>
              <th className="px-4 py-2">{t('textWindow.status')}</th>
              <th className="px-4 py-2">{t('textWindow.position')}</th>
              <th className="px-4 py-2">{t('textWindow.dimensions')}</th>
              <th className="px-4 py-2">{t('textWindow.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {textWindows.map((window) => (
              <tr key={window.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{window.title}</td>
                <td className="px-4 py-2">
                  {pages.find(p => p.value === window.page)?.label || window.page}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    window.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {window.active ? t('textWindow.active') : t('textWindow.inactive')}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Move className="w-4 h-4" />
                    <span>
                      X:{window.position.x}, Y:{window.position.y}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Layout className="w-4 h-4" />
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
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        // Extract the first translation key from title or content
                        const titleMatch = window.title.match(/\{\{([^}]+)\}\}/);
                        const contentMatch = window.content ? window.content.match(/\{\{([^}]+)\}\}/) : null;
                        
                        const key = titleMatch ? titleMatch[1].trim() : contentMatch ? contentMatch[1].trim() : '';
                        
                        if (key) {
                          setSelectedTranslationKey(key);
                          setShowTranslationEditor(true);
                        } else {
                          alert('No translation key found in this window. Please add a key in the format {{key}} first.');
                        }
                      }}
                      className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded"
                      title="Edit Translation"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(window.id)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {textWindows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {t('textWindow.noWindowsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showTranslationEditor && (
        <TranslationEditor 
          onClose={() => setShowTranslationEditor(false)} 
          initialKey={selectedTranslationKey}
        />
      )}
    </div>
  );
}

export default TextWindowManager;
