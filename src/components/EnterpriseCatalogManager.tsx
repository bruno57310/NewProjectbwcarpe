import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Copy, Save, X, AlertCircle, Check, Search, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import CatalogCategoriesManager from './CatalogCategoriesManager';
import type { Flour } from '../types/flour';

// Helper functions to convert between string and numeric values
const stringToNumeric = (value: string): number => {
  switch (value.toLowerCase()) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 2; // Default to medium
  }
};

const numericToString = (value: number): string => {
  switch (value) {
    case 1: return 'low';
    case 2: return 'medium';
    case 3: return 'high';
    default: return 'medium';
  }
};

const convertAntiNutrientsToNumeric = (antiNutrients: Record<string, string | number>): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(antiNutrients)) {
    if (typeof value === 'string') {
      result[key] = stringToNumeric(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

const convertMechanicalPropertiesToString = (properties: Record<string, number | string>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'number') {
      result[key] = numericToString(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

function EnterpriseCatalogManager() {
  const [flours, setFlours] = useState<Flour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingFlour, setEditingFlour] = useState<Flour | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    protein_profile: 'simple',
    protein_quality: 'incomplete',
    nutritional_values: {
      proteins: 0,
      lipids: 0,
      carbs: 0,
      fiber: 0,
      moisture: 0,
      ash: 0
    },
    protein_composition: {
      albumins: 25,
      globulins: 25,
      prolamins: 25,
      glutelins: 25
    },
    enzymatic_composition: {
      amylases: 0,
      proteases: 0,
      lipases: 0,
      phytases: 0
    },
    mechanical_properties: {
      binding: 'medium',
      stickiness: 'medium',
      water_absorption: 'medium'
    },
    anti_nutrients: {
      phytic_acid: 5,
      tannins: 5,
      saponins: 5,
      lectins: 5,
      trypsin_inhibitors: 5
    },
    solubility: 'medium',
    recommended_ratio: {
      min: 0,
      max: 100
    },
    tips: [] as string[],
    image_url: '',
    price_per_kg: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
      fetchFlours();
    }
  }, [isAdmin, searchTerm, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('flour_categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchFlours = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('flours_template')
        .select(`
          *,
          flour_categories (
            name
          )
        `);
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      query = query.order('name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        setFlours(data.map(flour => {
          // Convert mechanical properties to string values if needed
          const mechanicalProperties = typeof flour.mechanical_properties === 'object' ? 
            convertMechanicalPropertiesToString(flour.mechanical_properties) : 
            flour.mechanical_properties;
          
          return {
            ...flour,
            mechanical_properties: mechanicalProperties,
            category: flour.flour_categories?.name || 'Non catégorisé'
          };
        }));
      }
    } catch (err) {
      console.error('Error fetching flours:', err);
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
      // Validate protein composition sum equals 100
      const proteinSum = Object.values(formData.protein_composition).reduce((sum, val) => sum + val, 0);
      if (Math.abs(proteinSum - 100) > 0.01) {
        throw new Error(`${t('catalog.proteinComposition')} ${t('calculator.mustBe100')}`);
      }
      
      // For mechanical properties, keep as strings
      const mechanicalProperties = formData.mechanical_properties;
      
      if (editingFlour) {
        const { error } = await supabase
          .from('flours_template')
          .update({
            name: formData.name,
            description: formData.description,
            category_id: formData.category_id || null,
            protein_profile: formData.protein_profile,
            protein_quality: formData.protein_quality,
            nutritional_values: formData.nutritional_values,
            protein_composition: formData.protein_composition,
            enzymatic_composition: formData.enzymatic_composition,
            mechanical_properties: mechanicalProperties,
            anti_nutrients: formData.anti_nutrients,
            solubility: formData.solubility,
            recommended_ratio: formData.recommended_ratio,
            tips: formData.tips,
            image_url: formData.image_url || null,
            price_per_kg: formData.price_per_kg || null
          })
          .eq('id', editingFlour.id);
        
        if (error) throw error;
        setSuccess(t('common.success'));
      } else {
        const { error } = await supabase
          .from('flours_template')
          .insert([{
            name: formData.name,
            description: formData.description,
            category_id: formData.category_id || null,
            protein_profile: formData.protein_profile,
            protein_quality: formData.protein_quality,
            nutritional_values: formData.nutritional_values,
            protein_composition: formData.protein_composition,
            enzymatic_composition: formData.enzymatic_composition,
            mechanical_properties: mechanicalProperties,
            anti_nutrients: formData.anti_nutrients,
            solubility: formData.solubility,
            recommended_ratio: formData.recommended_ratio,
            tips: formData.tips,
            image_url: formData.image_url || null,
            price_per_kg: formData.price_per_kg || null
          }]);
        
        if (error) throw error;
        setSuccess(t('common.success'));
      }
      
      resetForm();
      fetchFlours();
    } catch (err) {
      console.error('Error saving flour:', err);
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    
    try {
      const { error } = await supabase
        .from('flours_template')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setFlours(flours.filter(flour => flour.id !== id));
      setSuccess(t('common.success'));
    } catch (err) {
      console.error('Error deleting flour:', err);
      setError(t('common.error'));
    }
  };

  const handleEdit = (flour: Flour) => {
    // Convert mechanical properties to string values if needed
    const mechanicalProperties = typeof flour.mechanical_properties === 'object' ? 
      convertMechanicalPropertiesToString(flour.mechanical_properties) : 
      flour.mechanical_properties;
    
    setEditingFlour(flour);
    setFormData({
      name: flour.name,
      description: flour.description || '',
      category_id: flour.category_id || '',
      protein_profile: flour.protein_profile,
      protein_quality: flour.protein_quality,
      nutritional_values: flour.nutritional_values,
      protein_composition: flour.protein_composition,
      enzymatic_composition: flour.enzymatic_composition,
      mechanical_properties: mechanicalProperties,
      anti_nutrients: flour.anti_nutrients,
      solubility: flour.solubility,
      recommended_ratio: flour.recommended_ratio,
      tips: flour.tips || [],
      image_url: flour.image_url || '',
      price_per_kg: flour.price_per_kg || 0
    });
    setIsAdding(true);
  };

  const handleDuplicate = async (flour: Flour) => {
    try {
      // Create a new flour with the same data but a different name
      const newName = `${flour.name} (copie)`;
      
      // Check if the name already exists
      const { data: existingFlour } = await supabase
        .from('flours_template')
        .select('id')
        .eq('name', newName)
        .maybeSingle();
      
      if (existingFlour) {
        throw new Error(`Une farine nommée "${newName}" existe déjà.`);
      }
      
      const { error } = await supabase
        .from('flours_template')
        .insert([{
          name: newName,
          description: flour.description,
          category_id: flour.category_id,
          protein_profile: flour.protein_profile,
          protein_quality: flour.protein_quality,
          nutritional_values: flour.nutritional_values,
          protein_composition: flour.protein_composition,
          enzymatic_composition: flour.enzymatic_composition,
          mechanical_properties: flour.mechanical_properties,
          anti_nutrients: flour.anti_nutrients,
          solubility: flour.solubility,
          recommended_ratio: flour.recommended_ratio,
          tips: flour.tips,
          image_url: flour.image_url,
          price_per_kg: flour.price_per_kg
        }]);
      
      if (error) throw error;
      
      setSuccess(`La farine "${flour.name}" a été dupliquée avec succès.`);
      fetchFlours();
    } catch (err) {
      console.error('Error duplicating flour:', err);
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingFlour(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      protein_profile: 'simple',
      protein_quality: 'incomplete',
      nutritional_values: {
        proteins: 0,
        lipids: 0,
        carbs: 0,
        fiber: 0,
        moisture: 0,
        ash: 0
      },
      protein_composition: {
        albumins: 25,
        globulins: 25,
        prolamins: 25,
        glutelins: 25
      },
      enzymatic_composition: {
        amylases: 0,
        proteases: 0,
        lipases: 0,
        phytases: 0
      },
      mechanical_properties: {
        binding: 'medium',
        stickiness: 'medium',
        water_absorption: 'medium'
      },
      anti_nutrients: {
        phytic_acid: 5,
        tannins: 5,
        saponins: 5,
        lectins: 5,
        trypsin_inhibitors: 5
      },
      solubility: 'medium',
      recommended_ratio: {
        min: 0,
        max: 100
      },
      tips: [],
      image_url: '',
      price_per_kg: 0
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFlours();
  };

  const handleAddTip = () => {
    const newTip = prompt('Entrez un nouveau conseil:');
    if (newTip) {
      setFormData({
        ...formData,
        tips: [...formData.tips, newTip]
      });
    }
  };

  const handleRemoveTip = (index: number) => {
    setFormData({
      ...formData,
      tips: formData.tips.filter((_, i) => i !== index)
    });
  };

  // Calculate protein composition sum
  const proteinCompositionSum = Object.values(formData.protein_composition).reduce((sum, val) => sum + val, 0);
  const isProteinSumValid = Math.abs(proteinCompositionSum - 100) < 0.01;

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-amber-800">
          {t('textWindow.adminOnly')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={() => {
            setShowCategories(true);
            setShowDuplicates(false);
            setIsAdding(false);
          }}
          className={`px-4 py-2 rounded-lg ${
            showCategories ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {t('catalog.category')}
        </button>
        <button
          onClick={() => {
            setShowCategories(false);
            setShowDuplicates(false);
            setIsAdding(false);
          }}
          className={`px-4 py-2 rounded-lg ${
            !showCategories && !showDuplicates && !isAdding ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {t('catalog.title')}
        </button>
        <button
          onClick={() => {
            setShowCategories(false);
            setShowDuplicates(true);
            setIsAdding(false);
          }}
          className={`px-4 py-2 rounded-lg ${
            showDuplicates ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Duplicates
        </button>
      </div>

      {showCategories ? (
        <CatalogCategoriesManager catalogType="enterprise" />
      ) : showDuplicates ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-green-800">
              Duplicate Flours to Public
            </h2>
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
                  placeholder={`${t('common.search')} ${t('catalog.title')}...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">{t('catalog.allCategories')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button 
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('common.search')}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">{t('privateCatalog.flours.name')}</th>
                    <th className="px-4 py-2">{t('catalog.category')}</th>
                    <th className="px-4 py-2">{t('catalog.proteins')}</th>
                    <th className="px-4 py-2">{t('catalog.proteinProfile')}</th>
                    <th className="px-4 py-2">{t('catalog.proteinQuality')}</th>
                    <th className="px-4 py-2">{t('privateCatalog.flours.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {flours.map((flour) => (
                    <tr key={flour.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{flour.name}</td>
                      <td className="px-4 py-2">{flour.category}</td>
                      <td className="px-4 py-2">{flour.nutritional_values.proteins}%</td>
                      <td className="px-4 py-2">{flour.protein_profile}</td>
                      <td className="px-4 py-2">{flour.protein_quality}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('flours')
                                  .insert([{
                                    name: flour.name,
                                    description: flour.description,
                                    category_id: flour.category_id,
                                    protein_profile: flour.protein_profile,
                                    protein_quality: flour.protein_quality,
                                    nutritional_values: flour.nutritional_values,
                                    protein_composition: flour.protein_composition,
                                    enzymatic_composition: flour.enzymatic_composition,
                                    mechanical_properties: flour.mechanical_properties,
                                    anti_nutrients: flour.anti_nutrients,
                                    solubility: flour.solubility,
                                    recommended_ratio: flour.recommended_ratio,
                                    tips: flour.tips,
                                    image_url: flour.image_url,
                                    price_per_kg: flour.price_per_kg
                                  }]);
                                
                                if (error) {
                                  if (error.code === '23505') {
                                    throw new Error(`Une farine nommée "${flour.name}" existe déjà dans le catalogue public.`);
                                  }
                                  throw error;
                                }
                                
                                setSuccess(`La farine "${flour.name}" a été copiée vers le catalogue public avec succès.`);
                              } catch (err) {
                                console.error('Error duplicating flour to public:', err);
                                setError(err instanceof Error ? err.message : t('common.error'));
                              }
                            }}
                            className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded"
                            title="Copier vers le catalogue public"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {flours.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {searchTerm || selectedCategory ? t('common.noResults') : t('privateCatalog.flours.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-green-800">
              {t('navigation.enterpriseCatalog')}
            </h2>
            <button
              onClick={() => {
                setIsAdding(true);
                setShowCategories(false);
                setShowDuplicates(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('common.add')} {t('catalog.flour')}
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

          {isAdding ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                {editingFlour ? t('common.edit') : t('common.create')} {t('catalog.flour')}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('privateCatalog.flours.name')} *
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
                      {t('catalog.category')}
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">{t('catalog.selectCategory')}</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('catalog.proteinProfile')}
                    </label>
                    <select
                      value={formData.protein_profile}
                      onChange={(e) => setFormData({ ...formData, protein_profile: e.target.value as 'simple' | 'complex' })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="simple">{t('flour.properties.simple')}</option>
                      <option value="complex">{t('flour.properties.complex')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('catalog.proteinQuality')}
                    </label>
                    <select
                      value={formData.protein_quality}
                      onChange={(e) => setFormData({ ...formData, protein_quality: e.target.value as 'complete' | 'incomplete' })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="complete">{t('flour.properties.complete')}</option>
                      <option value="incomplete">{t('flour.properties.incomplete')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('catalog.solubility')}
                    </label>
                    <select
                      value={formData.solubility}
                      onChange={(e) => setFormData({ ...formData, solubility: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="low">{t('flour.properties.low')}</option>
                      <option value="medium">{t('flour.properties.medium')}</option>
                      <option value="high">{t('flour.properties.high')}</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {t('catalog.nutritionalValues')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.keys(formData.nutritional_values).map(key => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key} (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.nutritional_values[key as keyof typeof formData.nutritional_values]}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              setFormData({
                                ...formData,
                                nutritional_values: {
                                  ...formData.nutritional_values,
                                  [key]: value
                                }
                              });
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {t('catalog.proteinComposition')} 
                    <span className={`ml-2 text-sm ${isProteinSumValid ? 'text-green-600' : 'text-red-600'}`}>
                      ({proteinCompositionSum.toFixed(2)}%)
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.keys(formData.protein_composition).map(key => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key} (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.protein_composition[key as keyof typeof formData.protein_composition]}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              setFormData({
                                ...formData,
                                protein_composition: {
                                  ...formData.protein_composition,
                                  [key]: value
                                }
                              });
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                  {!isProteinSumValid && (
                    <p className="mt-1 text-sm text-red-600">
                      {t('calculator.mustBe100')}
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {t('catalog.enzymaticComposition')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.keys(formData.enzymatic_composition).map(key => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key} (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.enzymatic_composition[key as keyof typeof formData.enzymatic_composition]}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              setFormData({
                                ...formData,
                                enzymatic_composition: {
                                  ...formData.enzymatic_composition,
                                  [key]: value
                                }
                              });
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {t('catalog.mechanicalProperties')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(formData.mechanical_properties).map(key => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key}
                        </label>
                        <select
                          value={formData.mechanical_properties[key as keyof typeof formData.mechanical_properties]}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              mechanical_properties: {
                                ...formData.mechanical_properties,
                                [key]: e.target.value as 'low' | 'medium' | 'high'
                              }
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="low">{t('flour.properties.low')}</option>
                          <option value="medium">{t('flour.properties.medium')}</option>
                          <option value="high">{t('flour.properties.high')}</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {t('catalog.antiNutrients')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.keys(formData.anti_nutrients).map(key => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key.replace('_', ' ')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={formData.anti_nutrients[key as keyof typeof formData.anti_nutrients]}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              setFormData({
                                ...formData,
                                anti_nutrients: {
                                  ...formData.anti_nutrients,
                                  [key]: value
                                }
                              });
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {t('catalog.recommendedRatio')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.recommended_ratio.min}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            setFormData({
                              ...formData,
                              recommended_ratio: {
                                ...formData.recommended_ratio,
                                min: value
                              }
                            });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.recommended_ratio.max}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            setFormData({
                              ...formData,
                              recommended_ratio: {
                                ...formData.recommended_ratio,
                                max: value
                              }
                            });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {t('catalog.tips')}
                  </h4>
                  <div className="space-y-2">
                    {formData.tips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tip}
                          onChange={(e) => {
                            const newTips = [...formData.tips];
                            newTips[index] = e.target.value;
                            setFormData({
                              ...formData,
                              tips: newTips
                            });
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTip(index)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddTip}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      {t('common.add')} {t('catalog.tip')}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {t('catalog.pricePerKg')} (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_per_kg}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setFormData({
                            ...formData,
                            price_per_kg: value
                          });
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
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
                    disabled={!isProteinSumValid}
                    className={`px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 ${
                      !isProteinSumValid ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={`${t('common.search')} ${t('catalog.title')}...`}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{t('catalog.allCategories')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {t('common.search')}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">{t('privateCatalog.flours.name')}</th>
                        <th className="px-4 py-2">{t('catalog.category')}</th>
                        <th className="px-4 py-2">{t('catalog.proteins')}</th>
                        <th className="px-4 py-2">{t('catalog.proteinProfile')}</th>
                        <th className="px-4 py-2">{t('catalog.proteinQuality')}</th>
                        <th className="px-4 py-2">{t('privateCatalog.flours.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {flours.map((flour) => (
                        <tr key={flour.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{flour.name}</td>
                          <td className="px-4 py-2">{flour.category}</td>
                          <td className="px-4 py-2">{flour.nutritional_values.proteins}%</td>
                          <td className="px-4 py-2">{flour.protein_profile}</td>
                          <td className="px-4 py-2">{flour.protein_quality}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(flour)}
                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title={t('common.edit')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(flour)}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Dupliquer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(flour.id)}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {flours.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            {searchTerm || selectedCategory ? t('common.noResults') : t('privateCatalog.flours.empty')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default EnterpriseCatalogManager;
