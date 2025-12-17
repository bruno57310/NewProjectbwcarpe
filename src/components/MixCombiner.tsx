import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Plus, Trash2, Save, AlertCircle, Check, Info, RefreshCw, Send } from 'lucide-react';
import type { SavedMix } from '../types/mix';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TextWindow from './TextWindow';
import MixCombinerN8nIntegration from './MixCombinerN8nIntegration';

interface MixItem {
  flourId: string;
  flourName: string;
  percentage: number;
  source?: 'public' | 'enterprise' | 'private';
  antiNutrientContribution?: {
    lectins: number;
    tannins: number;
    saponins: number;
    phytic_acid: number;
    trypsin_inhibitors: number;
    anti_nutrients_total_contri: number;
  };
  enzymeContribution?: {
    amylases: number;
    proteases: number;
    lipases: number;
    phytases: number;
    enzymes_total_contri: number;
  };
}

interface FlourDetails {
  id: string;
  name: string;
  nutritional_values: {
    proteins: number;
    lipids: number;
    carbs: number;
    fiber: number;
    moisture: number;
    ash: number;
  };
  protein_composition: {
    albumins: number;
    globulins: number;
    prolamins: number;
    glutelins: number;
  };
  enzymatic_composition: {
    amylases: number;
    proteases: number;
    lipases: number;
    phytases: number;
  };
  anti_nutrients: {
    phytic_acid: string | number;
    tannins: string | number;
    trypsin_inhibitors: string | number;
    saponins: string | number;
    lectins: string | number;
  };
  mechanical_properties: {
    binding: string;
    stickiness: string;
    water_absorption: string;
  };
  solubility: string;
}

function MixCombiner() {
  const [savedMixes, setSavedMixes] = useState<SavedMix[]>([]);
  const [selectedMixes, setSelectedMixes] = useState<string[]>([]);
  const [mixWeights, setMixWeights] = useState<Record<string, number>>({});
  const [combinedMix, setCombinedMix] = useState<MixItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingMix, setSavingMix] = useState(false);
  const [mixName, setMixName] = useState('');
  const [mixDescription, setMixDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [flourDetails, setFlourDetails] = useState<Record<string, FlourDetails>>({});
  const [loadingFlourDetails, setLoadingFlourDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    fetchSavedMixes();
  }, [user]);

  // Fetch saved mixes from the database
  const fetchSavedMixes = async () => {
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
      setSavedMixes(data || []);
    } catch (err) {
      console.error('Error fetching saved mixes:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSavedMixes();
    setRefreshing(false);
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

  // Handle mix selection
  const handleSelectMix = (mixId: string) => {
    setSelectedMixes(prev => {
      const newSelection = prev.includes(mixId) 
        ? prev.filter(id => id !== mixId)
        : [...prev, mixId];
      
      // Initialize weight for newly added mix
      if (!prev.includes(mixId) && newSelection.includes(mixId)) {
        setMixWeights(prevWeights => ({
          ...prevWeights,
          [mixId]: 1
        }));
      } else {
        // Remove weight for removed mix
        if (prev.includes(mixId) && !newSelection.includes(mixId)) {
          setMixWeights(prevWeights => {
            const newWeights = { ...prevWeights };
            delete newWeights[mixId];
            return newWeights;
          });
        }
      }
      
      return newSelection;
    });
  };

  // Handle weight change for a mix
  const handleWeightChange = (mixId: string, weight: number) => {
    setMixWeights(prev => ({
      ...prev,
      [mixId]: Math.max(0.1, Math.min(10, weight)) // Limit weight between 0.1 and 10
    }));
  };

  // Reset function to clear all selections and combined mix
  const handleReset = () => {
    setSelectedMixes([]);
    setMixWeights({});
    setCombinedMix([]);
    setMixName('');
    setMixDescription('');
    setShowSaveForm(false);
    setError(null);
    setSuccess(null);
  };

  // Combine selected mixes
  const handleCombineMixes = async () => {
    if (selectedMixes.length === 0) {
      setError(t('calculator.mixCombiner.selectMixesPrompt'));
      return;
    }

    try {
      setError(null);
      
      // Get the selected mixes
      const mixesToCombine = savedMixes.filter(mix => selectedMixes.includes(mix.id));
      
      // Create a map to track total percentage for each flour
      const flourMap: Record<string, { 
        flourId: string; 
        flourName: string; 
        percentage: number; 
        source?: 'public' | 'enterprise' | 'private';
        antiNutrientContribution?: {
          lectins: number;
          tannins: number;
          saponins: number;
          phytic_acid: number;
          trypsin_inhibitors: number;
          anti_nutrients_total_contri: number;
        };
        enzymeContribution?: {
          amylases: number;
          proteases: number;
          lipases: number;
          phytases: number;
          enzymes_total_contri: number;
        };
      }> = {};
      
      // Calculate the total weight to normalize percentages
      const totalWeight = selectedMixes.reduce((sum, id) => sum + (mixWeights[id] || 1), 0);
      
      // Combine the mixes
      mixesToCombine.forEach(mix => {
        // Get the weight for this mix (default to 1 if not set)
        const mixWeight = mixWeights[mix.id] || 1;
        
        // Calculate the normalized weight
        const normalizedWeight = mixWeight / totalWeight;
        
        mix.composition.forEach(item => {
          const adjustedPercentage = item.percentage * normalizedWeight;
          
          if (flourMap[item.flourId]) {
            flourMap[item.flourId].percentage += adjustedPercentage;
            
            // Combine anti-nutrient contributions if available
            if (item.antiNutrientContribution && flourMap[item.flourId].antiNutrientContribution) {
              flourMap[item.flourId].antiNutrientContribution!.lectins += (item.antiNutrientContribution.lectins * mixWeight);
              flourMap[item.flourId].antiNutrientContribution!.tannins += (item.antiNutrientContribution.tannins * mixWeight);
              flourMap[item.flourId].antiNutrientContribution!.saponins += (item.antiNutrientContribution.saponins * mixWeight);
              flourMap[item.flourId].antiNutrientContribution!.phytic_acid += (item.antiNutrientContribution.phytic_acid * mixWeight);
              flourMap[item.flourId].antiNutrientContribution!.trypsin_inhibitors += (item.antiNutrientContribution.trypsin_inhibitors * mixWeight);
              flourMap[item.flourId].antiNutrientContribution!.anti_nutrients_total_contri += (item.antiNutrientContribution.anti_nutrients_total_contri * mixWeight);
            }
            
            // Combine enzyme contributions if available
            if (item.enzymeContribution && flourMap[item.flourId].enzymeContribution) {
              flourMap[item.flourId].enzymeContribution!.amylases += (item.enzymeContribution.amylases * mixWeight);
              flourMap[item.flourId].enzymeContribution!.proteases += (item.enzymeContribution.proteases * mixWeight);
              flourMap[item.flourId].enzymeContribution!.lipases += (item.enzymeContribution.lipases * mixWeight);
              flourMap[item.flourId].enzymeContribution!.phytases += (item.enzymeContribution.phytases * mixWeight);
              flourMap[item.flourId].enzymeContribution!.enzymes_total_contri += (item.enzymeContribution.enzymes_total_contri * mixWeight);
            }
          } else {
            flourMap[item.flourId] = {
              flourId: item.flourId,
              flourName: item.flourName,
              percentage: adjustedPercentage,
              source: item.source,
              antiNutrientContribution: item.antiNutrientContribution ? {
                lectins: item.antiNutrientContribution.lectins * mixWeight,
                tannins: item.antiNutrientContribution.tannins * mixWeight,
                saponins: item.antiNutrientContribution.saponins * mixWeight,
                phytic_acid: item.antiNutrientContribution.phytic_acid * mixWeight,
                trypsin_inhibitors: item.antiNutrientContribution.trypsin_inhibitors * mixWeight,
                anti_nutrients_total_contri: item.antiNutrientContribution.anti_nutrients_total_contri * mixWeight
              } : undefined,
              enzymeContribution: item.enzymeContribution ? {
                amylases: item.enzymeContribution.amylases * mixWeight,
                proteases: item.enzymeContribution.proteases * mixWeight,
                lipases: item.enzymeContribution.lipases * mixWeight,
                phytases: item.enzymeContribution.phytases * mixWeight,
                enzymes_total_contri: item.enzymeContribution.enzymes_total_contri * mixWeight
              } : undefined
            };
          }
        });
      });
      
      // Convert the map to an array
      const combinedItems = Object.values(flourMap);
      
      // Normalize percentages to ensure they sum to 100%
      const totalPercentage = combinedItems.reduce((sum, item) => sum + item.percentage, 0);
      const normalizedItems = combinedItems.map(item => ({
        ...item,
        percentage: (item.percentage / totalPercentage) * 100
      }));
      
      // Sort by percentage (descending)
      normalizedItems.sort((a, b) => b.percentage - a.percentage);
      
      setCombinedMix(normalizedItems);
      
      // Fetch flour details for analysis
      await fetchFlourDetails(normalizedItems);
      
      // Set default mix name based on selected mixes
      if (mixesToCombine.length === 2) {
        setMixName(`${mixesToCombine[0].name} + ${mixesToCombine[1].name}`);
      } else if (mixesToCombine.length > 2) {
        setMixName(`Combined Mix (${mixesToCombine.length} mixes)`);
      }
    } catch (err) {
      console.error('Error combining mixes:', err);
      setError(t('common.error'));
    }
  };

  // Fetch flour details for analysis
  const fetchFlourDetails = async (items: MixItem[]) => {
    try {
      setLoadingFlourDetails(true);
      const flourIds = items.map(item => item.flourId);
      const details: Record<string, FlourDetails> = {};
      
      // Fetch from flours table
      const { data: floursData, error: floursError } = await supabase
        .from('flours')
        .select('*')
        .in('id', flourIds);
      
      if (floursError) throw floursError;
      
      if (floursData) {
        floursData.forEach(flour => {
          details[flour.id] = flour as FlourDetails;
        });
      }
      
      // Fetch from flours_template table
      const { data: templateData, error: templateError } = await supabase
        .from('flours_template')
        .select('*')
        .in('id', flourIds);
      
      if (templateError) throw templateError;
      
      if (templateData) {
        templateData.forEach(flour => {
          details[flour.id] = flour as FlourDetails;
        });
      }
      
      // Fetch from private_flours table
      const { data: privateData, error: privateError } = await supabase
        .from('private_flours')
        .select('*')
        .in('id', flourIds);
      
      if (privateError) throw privateError;
      
      if (privateData) {
        privateData.forEach(flour => {
          details[flour.id] = flour as FlourDetails;
        });
      }
      
      setFlourDetails(details);
    } catch (err) {
      console.error('Error fetching flour details:', err);
    } finally {
      setLoadingFlourDetails(false);
    }
  };

  // Save the combined mix
  const handleSaveMix = async () => {
    if (!mixName.trim()) {
      setError(t('calculator.saveMixModal.mixNameRequired'));
      return;
    }

    try {
      setSavingMix(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase
        .from('saved_mixes')
        .insert([
          {
            user_id: user?.id,
            name: mixName.trim(),
            description: mixDescription.trim() || null,
            composition: combinedMix
          }
        ])
        .select();

      if (error) throw error;

      setSuccess(`${t('common.success')}`);
      setShowSaveForm(false);
      setMixName('');
      setMixDescription('');
      
      // Refresh saved mixes
      await fetchSavedMixes();
    } catch (err) {
      console.error('Error saving mix:', err);
      setError(t('common.error'));
    } finally {
      setSavingMix(false);
    }
  };

  // Calculate nutritional values for the combined mix
  const calculateNutritionalValues = () => {
    if (combinedMix.length === 0 || Object.keys(flourDetails).length === 0) {
      return {
        proteins: 0,
        lipids: 0,
        carbs: 0,
        fiber: 0,
        moisture: 0,
        ash: 0
      };
    }

    const values = {
      proteins: 0,
      lipids: 0,
      carbs: 0,
      fiber: 0,
      moisture: 0,
      ash: 0
    };

    combinedMix.forEach(item => {
      const flour = flourDetails[item.flourId];
      if (flour && flour.nutritional_values) {
        values.proteins += (flour.nutritional_values.proteins * item.percentage) / 100;
        values.lipids += (flour.nutritional_values.lipids * item.percentage) / 100;
        values.carbs += (flour.nutritional_values.carbs * item.percentage) / 100;
        values.fiber += (flour.nutritional_values.fiber * item.percentage) / 100;
        values.moisture += (flour.nutritional_values.moisture * item.percentage) / 100;
        values.ash += (flour.nutritional_values.ash * item.percentage) / 100;
      }
    });

    return values;
  };

  // Calculate protein composition for the combined mix
  const calculateProteinComposition = () => {
    if (combinedMix.length === 0 || Object.keys(flourDetails).length === 0) {
      return {
        albumins: 0,
        globulins: 0,
        prolamins: 0,
        glutelins: 0
      };
    }

    const composition = {
      albumins: 0,
      globulins: 0,
      prolamins: 0,
      glutelins: 0
    };

    let totalProteinContribution = 0;

    combinedMix.forEach(item => {
      const flour = flourDetails[item.flourId];
      if (flour && flour.protein_composition && flour.nutritional_values) {
        const proteinContribution = (flour.nutritional_values.proteins * item.percentage) / 100;
        totalProteinContribution += proteinContribution;
        
        composition.albumins += (flour.protein_composition.albumins / 100) * proteinContribution;
        composition.globulins += (flour.protein_composition.globulins / 100) * proteinContribution;
        composition.prolamins += (flour.protein_composition.prolamins / 100) * proteinContribution;
        composition.glutelins += (flour.protein_composition.glutelins / 100) * proteinContribution;
      }
    });

    // Normalize to percentages if there's any protein
    if (totalProteinContribution > 0) {
      composition.albumins = (composition.albumins / totalProteinContribution) * 100;
      composition.globulins = (composition.globulins / totalProteinContribution) * 100;
      composition.prolamins = (composition.prolamins / totalProteinContribution) * 100;
      composition.glutelins = (composition.glutelins / totalProteinContribution) * 100;
    }

    return composition;
  };

  // Calculate mechanical properties for the combined mix
  const calculateMechanicalProperties = () => {
    if (combinedMix.length === 0 || Object.keys(flourDetails).length === 0) {
      return {
        binding: 'medium',
        stickiness: 'medium',
        water_absorption: 'medium'
      };
    }

    // Convert text values to numeric
    const getNumericValue = (value: string): number => {
      switch (value) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    };

    // Convert numeric values back to text
    const getTextValue = (value: number): string => {
      if (value > 2.5) return 'high';
      if (value > 1.5) return 'medium';
      return 'low';
    };

    const numericValues = {
      binding: 0,
      stickiness: 0,
      water_absorption: 0
    };

    combinedMix.forEach(item => {
      const flour = flourDetails[item.flourId];
      if (flour && flour.mechanical_properties) {
        numericValues.binding += (getNumericValue(flour.mechanical_properties.binding) * item.percentage) / 100;
        numericValues.stickiness += (getNumericValue(flour.mechanical_properties.stickiness) * item.percentage) / 100;
        numericValues.water_absorption += (getNumericValue(flour.mechanical_properties.water_absorption) * item.percentage) / 100;
      }
    });

    return {
      binding: getTextValue(numericValues.binding),
      stickiness: getTextValue(numericValues.stickiness),
      water_absorption: getTextValue(numericValues.water_absorption)
    };
  };

  // Calculate solubility for the combined mix
  const calculateSolubility = () => {
    if (combinedMix.length === 0 || Object.keys(flourDetails).length === 0) {
      return 'medium';
    }

    // Convert text values to numeric
    const getNumericValue = (value: string): number => {
      switch (value) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    };

    // Convert numeric values back to text
    const getTextValue = (value: number): string => {
      if (value > 2.5) return 'high';
      if (value > 1.5) return 'medium';
      return 'low';
    };

    let solubilityValue = 0;

    combinedMix.forEach(item => {
      const flour = flourDetails[item.flourId];
      if (flour && flour.solubility) {
        solubilityValue += (getNumericValue(flour.solubility) * item.percentage) / 100;
      }
    });

    return getTextValue(solubilityValue);
  };

  // Prepare data for pie chart
  const getPieChartData = () => {
    return combinedMix.map(item => ({
      name: item.flourName,
      value: item.percentage
    }));
  };

  // Prepare data for nutritional values chart
  const getNutritionalChartData = () => {
    const values = calculateNutritionalValues();
    return [
      { name: t('catalog.proteins'), value: values.proteins },
      { name: t('catalog.lipids'), value: values.lipids },
      { name: t('catalog.carbs'), value: values.carbs },
      { name: 'Fiber', value: values.fiber },
      { name: 'Moisture', value: values.moisture },
      { name: 'Ash', value: values.ash }
    ];
  };

  // Prepare data for protein composition chart
  const getProteinCompositionChartData = () => {
    const composition = calculateProteinComposition();
    return [
      { name: 'Albumins', value: composition.albumins },
      { name: 'Globulins', value: composition.globulins },
      { name: 'Prolamins', value: composition.prolamins },
      { name: 'Glutelins', value: composition.glutelins }
    ];
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-800 mb-6">
        {t('calculator.mixCombiner.title')}
      </h1>
      
      <p className="text-gray-600 mb-8">
        {t('calculator.mixCombiner.description')}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Mixes Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-6">
            {t('calculator.mixCombiner.savedMixes')}
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : savedMixes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('calculator.savedMixes.empty')}
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {savedMixes.map(mix => (
                <div 
                  key={mix.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedMixes.includes(mix.id) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMixes.includes(mix.id)}
                        onChange={() => handleSelectMix(mix.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <h3 className="font-semibold text-green-800">{mix.name}</h3>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {mix.id.substring(0, 8)}</span>
                  </div>
                  {mix.description && (
                    <p className="text-gray-600 text-sm mt-1">{mix.description}</p>
                  )}
                  
                  {selectedMixes.includes(mix.id) && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Weight:
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={mixWeights[mix.id] || 1}
                          onChange={(e) => handleWeightChange(mix.id, parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-700 min-w-[40px] text-right">
                          {(mixWeights[mix.id] || 1).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mix.composition.slice(0, 3).map((item, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {item.flourName}: {item.percentage.toFixed(1)}%
                      </span>
                    ))}
                    {mix.composition.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{mix.composition.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex gap-2">
            <button
              onClick={handleCombineMixes}
              disabled={selectedMixes.length === 0}
              className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                selectedMixes.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              <Plus className="w-5 h-5" />
              {t('calculator.mixCombiner.combine')}
            </button>
            <button
              onClick={handleReset}
              disabled={selectedMixes.length === 0 && combinedMix.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                selectedMixes.length === 0 && combinedMix.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              {t('common.reset')}
            </button>
          </div>

          {/* N8N Integration Section */}
          {selectedMixes.length > 0 && (
            <MixCombinerN8nIntegration 
              selectedMixes={selectedMixes} 
              savedMixes={savedMixes} 
              mixWeights={mixWeights}
            />
          )}
        </div>

        {/* Mix Analysis Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            {t('calculator.mixCombiner.combinedMix')}
          </h2>
          
          {combinedMix.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('calculator.mixCombiner.selectMixesPrompt')}
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="font-semibold text-green-700 mb-2">{t('calculator.mixComposition')}</h3>
                
                {selectedMixes.length > 0 && (
                  <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Mix Weights</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedMixes.map(mixId => {
                        const mix = savedMixes.find(m => m.id === mixId);
                        if (!mix) return null;
                        
                        const weight = mixWeights[mixId] || 1;
                        const totalWeight = selectedMixes.reduce((sum, id) => sum + (mixWeights[id] || 1), 0);
                        const percentage = (weight / totalWeight) * 100;
                        
                        return (
                          <div key={mixId} className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                            <span className="font-medium text-sm truncate max-w-[150px]">{mix.name}</span>
                            <span className="text-sm text-blue-700">{percentage.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {combinedMix.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{item.flourName}</span>
                          <span>{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {loadingFlourDetails ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Mix Composition Pie Chart */}
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">{t('calculator.mixComposition')}</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                          >
                            {getPieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Nutritional Values */}
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">{t('calculator.nutritionalValues')}</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getNutritionalChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" name="%" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Protein Composition */}
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">{t('catalog.proteinComposition')}</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getProteinCompositionChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                          <Legend />
                          <Bar dataKey="value" fill="#00C49F" name="%" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Mechanical Properties */}
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">{t('catalog.mechanicalProperties')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(calculateMechanicalProperties()).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                            <span className="capitalize">{value}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 rounded-full"
                              style={{ 
                                width: value === 'high' ? '75%' : value === 'medium' ? '50%' : '25%' 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Solubility */}
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">{t('catalog.solubility')}</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{t('catalog.solubility')}</span>
                        <span className="capitalize">{calculateSolubility()}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 rounded-full"
                          style={{ 
                            width: calculateSolubility() === 'high' ? '75%' : calculateSolubility() === 'medium' ? '50%' : '25%' 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Save Mix Button */}
              <div className="mt-8">
                {showSaveForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('calculator.saveMixModal.mixName')} *
                      </label>
                      <input
                        type="text"
                        value={mixName}
                        onChange={(e) => setMixName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder={t('calculator.saveMixModal.mixNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('calculator.saveMixModal.description')}
                      </label>
                      <textarea
                        value={mixDescription}
                        onChange={(e) => setMixDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        rows={3}
                        placeholder={t('calculator.saveMixModal.descriptionPlaceholder')}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSaveForm(false)}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMix}
                        disabled={savingMix || !mixName.trim()}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          savingMix || !mixName.trim()
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-700 text-white hover:bg-green-600'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        {savingMix ? t('common.loading') : t('common.save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSaveForm(true)}
                    disabled={combinedMix.length === 0}
                    className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      combinedMix.length === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-700 text-white hover:bg-green-600'
                    }`}
                  >
                    <Save className="w-5 h-5" />
                    {t('calculator.saveMix')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text Window for Calculator/Combine page */}
      <div className="relative mt-8">
        <TextWindow page="calculator/combine" /> 
      </div>
    </div>
  );
}

export default MixCombiner;
