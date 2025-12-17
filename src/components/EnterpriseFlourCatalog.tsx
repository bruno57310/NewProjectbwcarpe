import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Info, Home, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Flour } from '../types/flour';
import { Link, useNavigate } from 'react-router-dom';
import EditFlourDetails from './EditFlourDetails';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface AntiNutrientContribution {
  id: string;
  flour_id: string;
  flour_name?: string;
  category_name?: string;
  contribution_anti_nutrientsyall?: {
    lectins: number;
    tannins: number;
    saponins: number;
    phytic_acid: number;
    trypsin_inhibitors: number;
  };
  lectins: number;
  tannins: number;
  saponins: number;
  phytic_acid: number;
  trypsin_inhibitors: number;
  anti_nutrients_total_contri: number;
  created_at?: string;
  updated_at?: string;
}

interface EnzymeContribution {
  id: string;
  flour_id: string;
  flour_name?: string;
  category_name?: string;
  contribution_enzymesyall?: {
    amylases: number;
    proteases: number;
    lipases: number;
    phytases: number;
  };
  amylases: number;
  proteases: number;
  lipases: number;
  phytases: number;
  enzymes_total_contri: number;
  created_at?: string;
  updated_at?: string;
}

function EnterpriseFlourCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFlour, setSelectedFlour] = useState<Flour | null>(null);
  const [editingFlour, setEditingFlour] = useState<Flour | null>(null);
  const [flours, setFlours] = useState<Flour[]>([]);
  const [categories, setCategories] = useState<string[]>(['Toutes']);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ tier: string } | null>(null);
  const [antiNutrientContributions, setAntiNutrientContributions] = useState<Record<string, AntiNutrientContribution>>({});
  const [enzymeContributions, setEnzymeContributions] = useState<Record<string, EnzymeContribution>>({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      fetchData();
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('login_id', user?.id)
        .maybeSingle();
      
      setSubscription(data);
      
      // Redirect if not Enterprise subscriber
      if (!data || data.tier !== 'enterprise') {
        navigate('/pricing');
        return;
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('flour_categories')
        .select('name');
      
      if (categoriesError) throw categoriesError;
      
      if (categoriesData) {
        setCategories(['Toutes', ...categoriesData.map(c => c.name)]);
      }

      // Fetch flours with their categories
      const { data: floursData, error: floursError } = await supabase
        .from('flours_template')  // Using flours_template instead of flours
        .select(`
          *,
          flour_categories (
            name
          )
        `);

      if (floursError) throw floursError;

      if (floursData) {
        const flourIds = floursData.map(flour => flour.id);
        
        // Fetch anti-nutrient contributions
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributionanti_nutrients')
          .select('*')
          .in('flour_id', flourIds);
          
        if (contributionsError) throw contributionsError;
        
        // Create a map of flour ID to contribution data
        const contributionsMap: Record<string, AntiNutrientContribution> = {};
        if (contributionsData) {
          contributionsData.forEach(contribution => {
            // Extract values from contribution_anti_nutrientsyall if it exists
            let lectins = 0;
            let tannins = 0;
            let saponins = 0;
            let phytic_acid = 0;
            let trypsin_inhibitors = 0;
            
            if (contribution.contribution_anti_nutrientsyall) {
              const values = contribution.contribution_anti_nutrientsyall;
              lectins = values.lectins || 0;
              tannins = values.tannins || 0;
              saponins = values.saponins || 0;
              phytic_acid = values.phytic_acid || 0;
              trypsin_inhibitors = values.trypsin_inhibitors || 0;
            }
            
            contributionsMap[contribution.flour_id] = {
              ...contribution,
              lectins,
              tannins,
              saponins,
              phytic_acid,
              trypsin_inhibitors
            };
          });
        }
        
        setAntiNutrientContributions(contributionsMap);
        
        // Fetch enzyme contributions
        const { data: enzymeData, error: enzymeError } = await supabase
          .from('contributionenzymes')
          .select('*')
          .in('flour_id', flourIds);
          
        if (enzymeError) throw enzymeError;
        
        // Create a map of flour ID to enzyme contribution data
        const enzymeMap: Record<string, EnzymeContribution> = {};
        if (enzymeData) {
          enzymeData.forEach(contribution => {
            // Extract values from contribution_enzymesyall if it exists
            let amylases = 0;
            let proteases = 0;
            let lipases = 0;
            let phytases = 0;
            
            if (contribution.contribution_enzymesyall) {
              const values = contribution.contribution_enzymesyall;
              amylases = values.amylases || 0;
              proteases = values.proteases || 0;
              lipases = values.lipases || 0;
              phytases = values.phytases || 0;
            }
            
            enzymeMap[contribution.flour_id] = {
              ...contribution,
              amylases,
              proteases,
              lipases,
              phytases
            };
          });
        }
        
        setEnzymeContributions(enzymeMap);
        
        setFlours(floursData.map(flour => ({
          ...flour,
          category: flour.flour_categories?.name || 'Non catégorisé'
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlourUpdate = async (updatedFlour: Flour) => {
    try {
      const { error } = await supabase
        .from('flours_template')
        .update({
          name: updatedFlour.name,
          description: updatedFlour.description,
          protein_profile: updatedFlour.protein_profile,
          protein_quality: updatedFlour.protein_quality,
          nutritional_values: updatedFlour.nutritional_values,
          protein_composition: updatedFlour.protein_composition,
          enzymatic_composition: updatedFlour.enzymatic_composition,
          mechanical_properties: updatedFlour.mechanical_properties,
          anti_nutrients: updatedFlour.anti_nutrients,
          solubility: updatedFlour.solubility,
          recommended_ratio: updatedFlour.recommended_ratio,
          tips: updatedFlour.tips,
          price_per_kg: updatedFlour.price_per_kg,
          updated_at: new Date().toISOString(),
          anti_nutrients_total: updatedFlour.anti_nutrients_total,
          enzymes_total: updatedFlour.enzymes_total
        })
        .eq('id', updatedFlour.id);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      setFlours(prev => prev.map(f => 
        f.id === updatedFlour.id ? { ...f, ...updatedFlour } : f
      ));
      setSelectedFlour(updatedFlour);
      setEditingFlour(null);
    } catch (error) {
      console.error('Error updating flour:', error);
      throw error;
    }
  };

  const filteredFlours = useMemo(() => {
    return flours.filter(flour => {
      const matchesSearch = flour.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Toutes' || flour.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, flours]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  const defaultFlourImage = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
              title={t('common.back')}
            >
              <Home className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-green-800">
              {t('navigation.enterpriseCatalog')}
            </h1>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('catalog.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-green-100 text-green-800' : 'bg-green-700 text-white hover:bg-green-600'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              <span>{t('common.filter')}</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.category')}</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      className={`px-4 py-2 rounded-full text-sm ${
                        selectedCategory === category
                          ? 'bg-green-700 text-white'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlours.map(flour => (
            <div key={flour.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div 
                className="h-48 bg-cover bg-center bg-gray-100" 
                style={{ 
                  backgroundImage: `url(${flour.image_url || defaultFlourImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} 
              />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-green-800">{flour.name}</h3>
                    <p className="text-gray-600 mt-1">{flour.category}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t(`flour.properties.${flour.protein_profile}`)}
                  </span>
                </div>
                
                <div className="mt-3 space-y-2">
                  <PropertyBar label={t('catalog.proteins')} value={flour.nutritional_values.proteins} />
                  <PropertyBar 
                    label={t('catalog.binding')} 
                    value={flour.mechanical_properties.binding === 'high' ? 75 : flour.mechanical_properties.binding === 'medium' ? 50 : 25} 
                  />
                  <PropertyBar 
                    label={t('catalog.solubility')} 
                    value={flour.solubility === 'high' ? 75 : flour.solubility === 'medium' ? 50 : 25} 
                  />
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button 
                    className="flex-1 bg-green-700 text-white py-2 rounded hover:bg-green-600 transition-colors"
                    onClick={() => setSelectedFlour(flour)}
                  >
                    {t('catalog.details')}
                  </button>
                  <button
                    className="px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                    onClick={() => setEditingFlour(flour)}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedFlour && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-green-800">{selectedFlour.name}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingFlour(selectedFlour)}
                      className="text-green-600 hover:text-green-700"
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setSelectedFlour(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div 
                  className="mt-4 h-64 bg-cover bg-center rounded-lg"
                  style={{ 
                    backgroundImage: `url(${selectedFlour.image_url || defaultFlourImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />

                <div className="mt-6 space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.nutritionalValues')}</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">{t('catalog.proteins')}</p>
                        <p className="text-xl font-semibold text-green-800">{selectedFlour.nutritional_values.proteins}%</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">{t('catalog.lipids')}</p>
                        <p className="text-xl font-semibold text-green-800">{selectedFlour.nutritional_values.lipids}%</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">{t('catalog.carbs')}</p>
                        <p className="text-xl font-semibold text-green-800">{selectedFlour.nutritional_values.carbs}%</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Fiber</p>
                        <p className="text-xl font-semibold text-green-800">{selectedFlour.nutritional_values.fiber}%</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Moisture</p>
                        <p className="text-xl font-semibold text-green-800">{selectedFlour.nutritional_values.moisture}%</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Ash</p>
                        <p className="text-xl font-semibold text-green-800">{selectedFlour.nutritional_values.ash}%</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.properties')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('catalog.proteinProfile')}</p>
                        <p className="font-medium">{t(`flour.properties.${selectedFlour.protein_profile}`)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('catalog.proteinQuality')}</p>
                        <p className="font-medium">{t(`flour.properties.${selectedFlour.protein_quality}`)}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.proteinComposition')}</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedFlour.protein_composition).map(([type, percentage]) => (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{type}</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.enzymaticComposition')}</h3>
                    <div className="space-y-3">
                      {enzymeContributions[selectedFlour.id] ? (
                        <>
                          {Object.entries(enzymeContributions[selectedFlour.id].contribution_enzymesyall || {}).map(([enzyme, value]) => (
                            <div key={enzyme}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize">{enzyme}</span>
                                <span>{typeof value === 'number' ? value.toFixed(3) : '0.000'}</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600 rounded-full"
                                  style={{ width: `${typeof value === 'number' ? Math.min(value * 100, 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          <div className="bg-green-50 p-4 rounded-lg mt-2">
                            <p className="text-sm text-gray-600">Total Enzymes</p>
                            <p className="text-lg font-semibold text-green-800">
                              {selectedFlour.enzymes_total || enzymeContributions[selectedFlour.id].enzymes_total_contri.toFixed(2)}
                            </p>
                          </div>
                        </>
                      ) : (
                        Object.entries(selectedFlour.enzymatic_composition).map(([enzyme, percentage]) => (
                          <div key={enzyme}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{enzyme}</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.antiNutrients')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {antiNutrientContributions[selectedFlour.id] ? (
                        <>
                          {Object.entries(antiNutrientContributions[selectedFlour.id])
                            .filter(([key]) => ['lectins', 'tannins', 'saponins', 'phytic_acid', 'trypsin_inhibitors'].includes(key))
                            .map(([nutrient, value]) => (
                              <div key={nutrient} className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 capitalize">
                                  {nutrient.replace('_', ' ')}
                                </p>
                                <p className="text-lg font-semibold text-green-800">
                                  {typeof value === 'number' ? value.toFixed(2) : '0.00'}
                                </p>
                              </div>
                            ))}
                          <div className="bg-green-50 p-4 rounded-lg col-span-2">
                            <p className="text-sm text-gray-600 capitalize">
                              Total Anti-nutrients
                            </p>
                            <p className="text-lg font-semibold text-green-800">
                              {selectedFlour.anti_nutrients_total || antiNutrientContributions[selectedFlour.id].anti_nutrients_total_contri?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </>
                      ) : (
                        Object.entries(selectedFlour.anti_nutrients).map(([nutrient, level]) => {
                          // Convert to string if it's a number
                          const displayValue = typeof level === 'number' 
                            ? level.toFixed(2)
                            : level;
                            
                          return (
                            <div key={nutrient} className="bg-green-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 capitalize">
                                {nutrient.replace('_', ' ')}
                              </p>
                              <p className="text-lg font-semibold text-green-800">
                                {displayValue}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.mechanicalProperties')}</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedFlour.mechanical_properties).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{t(`catalog.${key}`)}</span>
                            <span>{value}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 rounded-full"
                              style={{ width: value === 'high' ? '75%' : value === 'medium' ? '50%' : '25%' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.usage')}</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">{t('catalog.recommendedRatio')}</p>
                      <p className="text-xl font-semibold text-green-800 mb-4">
                        {selectedFlour.recommended_ratio.min}% - {selectedFlour.recommended_ratio.max}%
                      </p>
                      <ul className="space-y-2">
                        {selectedFlour.tips && selectedFlour.tips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <Info className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingFlour && (
          <EditFlourDetails
            flour={editingFlour}
            onClose={() => setEditingFlour(null)}
            onUpdate={handleFlourUpdate}
            antiNutrientContributions={antiNutrientContributions[editingFlour.id]}
            enzymeContributions={enzymeContributions[editingFlour.id]}
          />
        )}
      </div>
    </div>
  );
}

function PropertyBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default EnterpriseFlourCatalog;
