import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, Check, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

interface CatalogCategoriesManagerProps {
  catalogType: 'public' | 'enterprise' | 'private';
}

function CatalogCategoriesManager({ catalogType }: CatalogCategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    if (isAdmin || catalogType === 'private') {
      fetchCategories();
    }
  }, [isAdmin, catalogType, searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      let tableName = '';
      let userIdColumn = '';
      
      // Determine which table to query based on catalog type
      if (catalogType === 'private') {
        tableName = 'private_flour_categories';
        userIdColumn = 'user_id_private_category';
      } else {
        tableName = 'flour_categories';
      }
      
      let query = supabase
        .from(tableName)
        .select('*');
      
      // Add user ID filter for private categories
      if (catalogType === 'private') {
        query = query.eq(userIdColumn, user?.id);
      }
      
      // Add search filter if provided
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      // Order by name
      query = query.order('name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (editingCategory) {
        if (catalogType === 'private') {
          const { error } = await supabase
            .from('private_flour_categories')
            .update({
              name: formData.name,
              description: formData.description,
              image_url: formData.image_url || null
            })
            .eq('id', editingCategory.id)
            .eq('user_id_private_category', user?.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('flour_categories')
            .update({
              name: formData.name,
              description: formData.description,
              image_url: formData.image_url || null
            })
            .eq('id', editingCategory.id);
          
          if (error) throw error;
        }
        setSuccess(t('common.success'));
      } else {
        if (catalogType === 'private') {
          const { error } = await supabase
            .from('private_flour_categories')
            .insert([{
              name: formData.name,
              description: formData.description,
              image_url: formData.image_url || null,
              user_id_private_category: user?.id
            }]);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('flour_categories')
            .insert([{
              name: formData.name,
              description: formData.description,
              image_url: formData.image_url || null
            }]);
          
          if (error) throw error;
        }
        setSuccess(t('common.success'));
      }
      
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    
    try {
      // Check if category is used by any flours
      let tableName = '';
      let categoryColumn = '';
      let userIdColumn = '';
      
      if (catalogType === 'private') {
        tableName = 'private_flours';
        categoryColumn = 'private_flour_categories_id';
        userIdColumn = 'user_id_private_flours';
      } else if (catalogType === 'enterprise') {
        tableName = 'flours_template';
        categoryColumn = 'category_id';
      } else {
        tableName = 'flours';
        categoryColumn = 'category_id';
      }
      
      let countQuery = supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(categoryColumn, id);
      
      // Add user ID filter for private flours
      if (catalogType === 'private') {
        countQuery = countQuery.eq(userIdColumn, user?.id);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error(`Cette catégorie est utilisée par ${count} farines. Veuillez d'abord les réaffecter.`);
      }
      
      // Delete the category
      if (catalogType === 'private') {
        const { error } = await supabase
          .from('private_flour_categories')
          .delete()
          .eq('id', id)
          .eq('user_id_private_category', user?.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('flour_categories')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setCategories(categories.filter(category => category.id !== id));
      setSuccess(t('common.success'));
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || ''
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image_url: ''
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCategories();
  };

  if (!isAdmin && catalogType !== 'private') {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-amber-800">
          {t('textWindow.adminOnly')}
        </p>
      </div>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-green-800">
          {catalogType === 'enterprise' ? 
            t('navigation.enterpriseCatalog') : 
            catalogType === 'private' ?
            t('navigation.privateCatalog') :
            t('navigation.publicCatalog')} - {t('catalog.category')}
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('common.add')} {t('catalog.category')}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`${t('common.search')} ${t('catalog.category')}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {t('common.search')}
          </button>
        </form>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            {editingCategory ? t('common.edit') : t('common.create')} {t('catalog.category')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('privateCatalog.categories.name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('catalog.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
              />
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
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">{t('privateCatalog.categories.name')}</th>
                <th className="px-4 py-2">{t('catalog.description')}</th>
                <th className="px-4 py-2">{t('privateCatalog.categories.createdAt')}</th>
                <th className="px-4 py-2">{t('privateCatalog.categories.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{category.name}</td>
                  <td className="px-4 py-2">{category.description || '-'}</td>
                  <td className="px-4 py-2">{new Date(category.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? t('common.noResults') : t('privateCatalog.categories.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CatalogCategoriesManager;
