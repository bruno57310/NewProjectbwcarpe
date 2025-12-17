import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Eye, Calendar, Link as LinkIcon, Move, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Banner {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  placement: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  position?: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
}

interface BannerFormData {
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  placement: string;
  active: boolean;
  start_date: string;
  end_date: string;
  position?: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
}

function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    content: '',
    image_url: '',
    link_url: '',
    placement: 'home',
    active: true,
    start_date: '',
    end_date: '',
    position: {
      x: 0,
      y: 0,
      width: '100%',
      height: 'auto',
      zIndex: 10
    }
  });
  const { t } = useTranslation();

  const placements = [
    { value: 'home', label: t('textWindow.placements.home') },
    { value: 'catalog', label: t('textWindow.placements.catalog') },
    { value: 'calculator', label: t('textWindow.placements.calculator') },
    { value: 'dashboard', label: t('textWindow.placements.dashboard') }
  ];

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError(t('textWindow.errors.loadingBanners'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const bannerData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        position: {
          x: formData.position?.x || 0,
          y: formData.position?.y || 0,
          width: formData.position?.width || '100%',
          height: formData.position?.height || 'auto',
          zIndex: formData.position?.zIndex || 10
        }
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);

        if (error) throw error;
      }

      await fetchBanners();
      setIsAdding(false);
      setEditingBanner(null);
      setFormData({
        title: '',
        content: '',
        image_url: '',
        link_url: '',
        placement: 'home',
        active: true,
        start_date: '',
        end_date: '',
        position: {
          x: 0,
          y: 0,
          width: '100%',
          height: 'auto',
          zIndex: 10
        }
      });
    } catch (err) {
      console.error('Error saving banner:', err);
      setError(t('textWindow.errors.savingBanner'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError(t('textWindow.errors.deletingBanner'));
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      content: banner.content || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      placement: banner.placement,
      active: banner.active,
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
      position: banner.position || {
        x: 0,
        y: 0,
        width: '100%',
        height: 'auto',
        zIndex: 10
      }
    });
    setIsAdding(true);
  };

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
          {t('textWindow.bannerManagement')}
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('textWindow.addBanner')}
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
                rows={3}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('textWindow.contentTip')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('textWindow.imageUrl')}
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('textWindow.linkUrl')}
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('textWindow.placement')} *
              </label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                {placements.map(placement => (
                  <option key={placement.value} value={placement.value}>
                    {placement.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('textWindow.startDate')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('textWindow.endDate')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
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
                    value={formData.position?.x || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position!,
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
                    value={formData.position?.y || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position!,
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
                    value={formData.position?.width || '100%'}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position!,
                        width: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="100%, 500px, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('textWindow.height')}
                  </label>
                  <input
                    type="text"
                    value={formData.position?.height || 'auto'}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position!,
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
                    value={formData.position?.zIndex || 10}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: {
                        ...formData.position!,
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
                {t('textWindow.active')}
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingBanner(null);
                  setFormData({
                    title: '',
                    content: '',
                    image_url: '',
                    link_url: '',
                    placement: 'home',
                    active: true,
                    start_date: '',
                    end_date: '',
                    position: {
                      x: 0,
                      y: 0,
                      width: '100%',
                      height: 'auto',
                      zIndex: 10
                    }
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
                {editingBanner ? t('common.update') : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">{t('textWindow.title')}</th>
              <th className="px-4 py-2">{t('textWindow.placement')}</th>
              <th className="px-4 py-2">{t('textWindow.status')}</th>
              <th className="px-4 py-2">{t('textWindow.period')}</th>
              <th className="px-4 py-2">{t('textWindow.position')}</th>
              <th className="px-4 py-2">{t('textWindow.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {banners.map((banner) => (
              <tr key={banner.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{banner.title}</td>
                <td className="px-4 py-2">
                  {placements.find(p => p.value === banner.placement)?.label}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {banner.active ? t('textWindow.active') : t('textWindow.inactive')}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : t('textWindow.indefinite')}
                      {' → '}
                      {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : t('textWindow.indefinite')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Move className="w-4 h-4" />
                    <span>
                      {banner.position ? 
                        `X:${banner.position.x}, Y:${banner.position.y}, Z:${banner.position.zIndex || 10}` : 
                        t('textWindow.default')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {banner.link_url && (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                        title={t('textWindow.viewLink')}
                      >
                        <LinkIcon className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {t('textWindow.noBannersFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BannerManager;
