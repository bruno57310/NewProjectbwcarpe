import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Trash2, AlertCircle, Check, Save, RotateCcw, Database, Lock, Book } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { useTranslation } from 'react-i18next';
import SaveMixModal from './SaveMixModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TextWindow from './TextWindow';
import type { Flour } from '../types/flour';
import type { SavedMix } from '../types/mix';
import SavedMixes from './SavedMixes';

interface MixCalculatorProps {
  viewMode?: boolean;
  editMode?: boolean;
  initialMix?: SavedMix | null;
}

function MixCalculator({ viewMode = false, editMode = false, initialMix = null }: MixCalculatorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedCatalog, setSelectedCatalog] = useState('public');
  const [selectedFlourId, setSelectedFlourId] = useState('');
  const [mix, setMix] = useState<Array<{
    flourId: string;
    flourName: string;
    percentage: number;
    source?: 'public' | 'enterprise' | 'private';
    nutritionalValues?: any;
    proteinComposition?: any;
    mechanicalProperties?: any;
    solubility?: string;
    antiNutrients?: any;
    antiNutrientContribution?: any;
    enzymeContribution?: any;
  }>>([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ tier: string } | null>(null);
  const [flours, setFlours] = useState<Flour[]>([]);
  const [antiNutrientContributions, setAntiNutrientContributions] = useState<Record<string, any>>({});
  const [enzymeContributions, setEnzymeContributions] = useState<Record<string, any>>({});
  const [showSavedMixes, setShowSavedMixes] = useState(false);
  const [selectedMixTitle, setSelectedMixTitle] = useState<string | null>(null);
  
  const mixContainerRef = useRef<HTMLDivElement>(null);

  const fetchFlours = async () => {
    setLoading(true);
    try {
      let query;
      
      if (selectedCatalog === 'public') {
        query = supabase.from('flours').select('*');
      } else if (selectedCatalog === 'enterprise') {
        query = supabase.from('flours_template').select('*');
      } else if (selectedCatalog === 'private') {
        query = supabase.from('private_flours').select('*').eq('user_id_private_flours', user?.id);
      }
      
      const { data, error } = await query?.order('name');
      
      if (error) throw error;
      
      setFlours(data || []);
      
      // Fetch contributions after flours are loaded
      if (data && data.length > 0) {
        await fetchContributions(data, selectedCatalog);
      }
    } catch (err) {
      console.error('Error fetching flours:', err);
      setError('Failed to load flours');
    } finally {
      setLoading(false);
    }
  };

  // Initialize from location state if available
  useEffect(() => {
    if (location.state?.mix) {
      const { mix } = location.state;
      if (mix) {
        setMix(mix.composition || []);
        setSelectedMixTitle(mix.name || null);
      }
    }
  }, [location]);

  // Initialize from initialMix if provided
  useEffect(() => {
    if (initialMix && initialMix.composition) {
      setMix(initialMix.composition);
      setSelectedMixTitle(initialMix.name || null);
    }
  }, [initialMix]);

  // Fetch user subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('login_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    };

    fetchSubscription();
  }, [user]);

  // Re-fetch contributions when subscription changes
  useEffect(() => {
    if (user && subscription && flours.length > 0) {
      console.log('Re-fetching contributions due to subscription/catalog change:', {
        subscription: subscription.tier,
        catalog: selectedCatalog,
        flourCount: flours.length
      });
      fetchContributions(flours, selectedCatalog);
    }
  }, [user, subscription, selectedCatalog, flours]);

  // Fetch flours based on selected catalog
  useEffect(() => {
    fetchFlours();
  }, [selectedCatalog, user]);


  const fetchContributions = async (flourData: Flour[], catalog: string) => {
    try {
      const flourIds = flourData.map(flour => flour.id);
      
      // Determine which tables to use based on catalog
      let antiNutrientsTable: string;
      let enzymesTable: string;
      
      if (catalog === 'public') {
        antiNutrientsTable = 'publiccontributionanti_nutrients';
        enzymesTable = 'publiccontributionenzymes';
      } else if (catalog === 'enterprise') {
        antiNutrientsTable = 'contributionanti_nutrients';
        enzymesTable = 'contributionenzymes';
      } else {
        antiNutrientsTable = 'contributionanti_nutrients_private';
        enzymesTable = 'contributionenzymes_private';
      }
      
      console.log(`Fetching contributions from tables: ${antiNutrientsTable}, ${enzymesTable}`);
      console.log(`Flour IDs:`, flourIds);
      
      // Fetch anti-nutrient contributions
      const { data: antiNutrientsData, error: antiNutrientsError } = await supabase
        .from(antiNutrientsTable)
        .select('*')
        .in('flour_id', flourIds);
      
      if (antiNutrientsError) throw antiNutrientsError;
      
      console.log(`Anti-nutrient contributions fetched:`, antiNutrientsData);
      
      // Create a map of flour ID to contribution data
      const antiNutrientsMap: Record<string, any> = {};
      if (antiNutrientsData) {
        antiNutrientsData.forEach(contribution => {
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
          
          antiNutrientsMap[contribution.flour_id] = {
            ...contribution,
            lectins,
            tannins,
            saponins,
            phytic_acid,
            trypsin_inhibitors
          };
        });
      }
      
      setAntiNutrientContributions(antiNutrientsMap);
      
      // Fetch enzyme contributions
      const { data: enzymesData, error: enzymesError } = await supabase
        .from(enzymesTable)
        .select('*')
        .in('flour_id', flourIds);
      
      if (enzymesError) throw enzymesError;
      
      console.log(`Enzyme contributions fetched:`, enzymesData);
      
      // Create a map of flour ID to contribution data
      const enzymesMap: Record<string, any> = {};
      if (enzymesData) {
        enzymesData.forEach(contribution => {
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
          
          enzymesMap[contribution.flour_id] = {
            ...contribution,
            amylases,
            proteases,
            lipases,
            phytases
          };
        });
      }
      
      setEnzymeContributions(enzymesMap);
    } catch (err) {
      console.error('Error fetching contributions:', err);
      console.error('Catalog:', catalog);
      console.error('Tables:', { antiNutrientsTable, enzymesTable });
    }
  };

  const totalPercentage = mix.reduce((sum, item) => sum + item.percentage, 0);
  const isValidMix = Math.abs(totalPercentage - 100) < 0.1;

  const handleAddFlour = () => {
    if (!selectedFlourId) {
      setError(t('calculator.selectFlour'));
      return;
    }

    const selectedFlour = flours.find(f => f.id === selectedFlourId);
    if (!selectedFlour) {
      setError(t('calculator.flourNotFound'));
      return;
    }

    if (mix.some(item => item.flourId === selectedFlourId)) {
      setError(t('calculator.flourAlreadyAdded'));
      return;
    }

    // Get contribution data if available
    const antiNutrientContribution = antiNutrientContributions[selectedFlourId];
    const enzymeContribution = enzymeContributions[selectedFlourId];

    console.log(`Adding flour ${selectedFlour.name}:`, {
      antiNutrientContribution,
      enzymeContribution,
      selectedCatalog
    });
    setMix([...mix, {
      flourId: selectedFlourId,
      flourName: selectedFlour.name,
      percentage: 0,
      source: selectedCatalog as 'public' | 'enterprise' | 'private',
      nutritionalValues: selectedFlour.nutritional_values,
      proteinComposition: selectedFlour.protein_composition,
      mechanicalProperties: selectedFlour.mechanical_properties,
      solubility: selectedFlour.solubility,
      antiNutrients: selectedFlour.anti_nutrients,
      antiNutrientContribution,
      enzymeContribution
    }]);
    setError('');
  };

  const handleRemoveFlour = (flourId: string) => {
    setMix(mix.filter(item => item.flourId !== flourId));
  };

  const handlePercentageChange = (flourId: string, newPercentage: number) => {
    setMix(mix.map(item =>
      item.flourId === flourId
        ? { ...item, percentage: newPercentage }
        : item
    ));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFlours();
    setRefreshing(false);
  };

  const handleReset = () => {
    setMix([]);
    setError('');
    setSuccess('');
  };

  const handleSaveMix = async (name: string, description: string, tags: string[]) => {
    if (!user) {
      navigate('/auth', { state: { from: '/calculator' } });
      return;
    }
    
    try {
      const mixData = {
        user_id: user.id,
        name,
        description: description || null,
        composition: mix,
        tags: tags || []
      };
      
      if (editMode && initialMix) {
        // Update existing mix
        const { error } = await supabase
          .from('saved_mixes')
          .update(mixData)
          .eq('id', initialMix.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        setSuccess(t('calculator.mixUpdated'));
      } else {
        // Create new mix
        const { error } = await supabase
          .from('saved_mixes')
          .insert([mixData]);
        
        if (error) throw error;
        setSuccess(t('calculator.mixSaved'));
      }
      
      setShowSaveModal(false);
      setShowSavedMixes(true); // Show saved mixes after saving
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSelectMix = (selectedMix: SavedMix) => {
    setMix(selectedMix.composition);
    setSelectedMixTitle(selectedMix.name);
    setShowSavedMixes(false);
  };

  const handleEditMix = (selectedMix: SavedMix) => {
    navigate('/calculator', { 
      state: { 
        mix: selectedMix,
        mode: 'edit'
      }
    });
    setSelectedMixTitle(selectedMix.name);
    setShowSavedMixes(false);
  };

  const calculateNutritionalValues = () => {
    const values = {
      proteins: 0,
      carbs: 0,
      lipids: 0,
      fiber: 0,
      moisture: 0,
      ash: 0
    };

    mix.forEach(item => {
      const percentage = item.percentage / 100;
      Object.keys(values).forEach(key => {
        values[key as keyof typeof values] += (item.nutritionalValues?.[key] || 0) * percentage;
      });
    });

    return values;
  };

  const calculateProteinComposition = () => {
    const composition = {
      albumins: 0,
      globulins: 0,
      prolamins: 0,
      glutelins: 0
    };

    mix.forEach(item => {
      const percentage = item.percentage / 100;
      Object.keys(composition).forEach(key => {
        composition[key as keyof typeof composition] += (item.proteinComposition?.[key] || 0) * percentage;
      });
    });

    return composition;
  };

  const calculateEnzymaticComposition = () => {
    const enzymes = {
      amylases: 0,
      proteases: 0,
      lipases: 0,
      phytases: 0
    };

    mix.forEach(item => {
      const percentage = item.percentage / 100;
      
      // Get contribution data for this flour
      const contribution = enzymeContributions[item.flourId];
      
      console.log(`Calculating enzymes for ${item.flourName}:`, {
        contribution,
        percentage,
        selectedCatalog
      });
      
      if (contribution?.contribution_enzymesyall) {
        // Use precise contribution values from public tables
        Object.keys(enzymes).forEach(key => {
          enzymes[key as keyof typeof enzymes] += 
            (contribution.contribution_enzymesyall[key] || 0) * percentage;
        });
      } else if (contribution) {
        // Use direct values from contribution object
        enzymes.amylases += (contribution.amylases || 0) * percentage;
        enzymes.proteases += (contribution.proteases || 0) * percentage;
        enzymes.lipases += (contribution.lipases || 0) * percentage;
        enzymes.phytases += (contribution.phytases || 0) * percentage;
      } else {
        // Fallback to basic enzymatic composition from flour data
        const flourData = flours.find(f => f.id === item.flourId);
        if (flourData?.enzymatic_composition) {
          Object.keys(enzymes).forEach(key => {
            enzymes[key as keyof typeof enzymes] += 
              (flourData.enzymatic_composition[key] || 0) * percentage;
          });
        }
      }
    });

    console.log('Final enzyme calculation result:', enzymes);
    return enzymes;
  };

  const calculateTotalEnzymes = () => {
    const enzymes = calculateEnzymaticComposition();
    return Object.values(enzymes).reduce((sum, value) => sum + value, 0);
  };

  const calculateMechanicalProperties = () => {
    const properties = {
      binding: 0,
      stickiness: 0,
      water_absorption: 0
    };

    const valueMap = {
      low: 1,
      medium: 2,
      high: 3
    };

    mix.forEach(item => {
      const percentage = item.percentage / 100;
      Object.keys(properties).forEach(key => {
        properties[key as keyof typeof properties] += valueMap[item.mechanicalProperties?.[key] as keyof typeof valueMap] * percentage;
      });
    });

    return Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [
        key,
        value <= 1.67 ? 'low' : value <= 2.33 ? 'medium' : 'high'
      ])
    );
  };

  const calculateSolubility = () => {
    const valueMap = {
      low: 1,
      medium: 2,
      high: 3
    };

    let totalSolubility = 0;
    mix.forEach(item => {
      const percentage = item.percentage / 100;
      totalSolubility += valueMap[item.solubility as keyof typeof valueMap] * percentage;
    });

    return totalSolubility <= 1.67 ? 'low' : totalSolubility <= 2.33 ? 'medium' : 'high';
  };

  const calculateAntiNutrients = () => {
    const nutrients = {
      lectins: 0,
      tannins: 0,
      saponins: 0,
      phytic_acid: 0,
      trypsin_inhibitors: 0
    };

    mix.forEach(item => {
      const percentage = item.percentage / 100;
      
      // Get contribution data for this flour
      const contribution = antiNutrientContributions[item.flourId];
      
      console.log(`Calculating anti-nutrients for ${item.flourName}:`, {
        contribution,
        percentage,
        selectedCatalog
      });
      
      if (contribution?.contribution_anti_nutrientsyall) {
        // Use precise contribution values from public tables
        Object.keys(nutrients).forEach(key => {
          nutrients[key as keyof typeof nutrients] += 
            (contribution.contribution_anti_nutrientsyall[key] || 0) * percentage;
        });
      } else if (contribution) {
        // Use direct values from contribution object
        nutrients.lectins += (contribution.lectins || 0) * percentage;
        nutrients.tannins += (contribution.tannins || 0) * percentage;
        nutrients.saponins += (contribution.saponins || 0) * percentage;
        nutrients.phytic_acid += (contribution.phytic_acid || 0) * percentage;
        nutrients.trypsin_inhibitors += (contribution.trypsin_inhibitors || 0) * percentage;
      } else {
        // Fallback to qualitative values from flour data
        const flourData = flours.find(f => f.id === item.flourId);
        if (flourData?.anti_nutrients) {
          const valueMap = {
            low: 0.5,
            medium: 1.5,
            high: 2.5
          };
          
          Object.keys(nutrients).forEach(key => {
            const value = flourData.anti_nutrients[key];
            if (typeof value === 'string') {
              nutrients[key as keyof typeof nutrients] += valueMap[value as keyof typeof valueMap] * percentage;
            } else if (typeof value === 'number') {
              nutrients[key as keyof typeof nutrients] += value * percentage;
            }
          });
        }
      }
    });

    console.log('Final anti-nutrient calculation result:', nutrients);
    return nutrients;
  };

  const calculateTotalAntiNutrients = () => {
    const nutrients = calculateAntiNutrients();
    return Object.values(nutrients).reduce((sum, value) => sum + value, 0);
  };

  const getPieChartData = () => {
    return mix.map(item => ({
      name: item.flourName,
      value: item.percentage
    }));
  };

  const getNutritionalChartData = () => {
    const values = calculateNutritionalValues();
    return Object.entries(values).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));
  };

  const getProteinCompositionChartData = () => {
    const composition = calculateProteinComposition();
    return [
      { name: 'Albumins', value: composition.albumins },
      { name: 'Globulins', value: composition.globulins },
      { name: 'Prolamins', value: composition.prolamins },
      { name: 'Glutelins', value: composition.glutelins }
    ];
  };

  const getEnzymaticCompositionChartData = () => {
    const enzymes = calculateEnzymaticComposition();
    return [
      { name: 'Amylases', value: enzymes.amylases },
      { name: 'Proteases', value: enzymes.proteases },
      { name: 'Lipases', value: enzymes.lipases },
      { name: 'Phytases', value: enzymes.phytases }
    ];
  };

  // Function to get source icon and label
  const getSourceInfo = (source?: 'public' | 'enterprise' | 'private') => {
    switch (source) {
      case 'enterprise':
        return {
          icon: <Database className="w-4 h-4 text-purple-600" />,
          label: "Enterprise Catalog",
          color: "bg-purple-100 text-purple-800"
        };
      case 'private':
        return {
          icon: <Lock className="w-4 h-4 text-blue-600" />,
          label: "Private Catalog",
          color: "bg-blue-100 text-blue-800"
        };
      case 'public':
      default:
        return {
          icon: <Book className="w-4 h-4 text-green-600" />,
          label: "Public Catalog",
          color: "bg-green-100 text-green-800"
        };
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Check if mix composition is displayed (mix has items and at least one chart is visible)
  const isMixCompositionDisplayed = mix.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {viewMode ? t('calculator.viewMix') : editMode ? t('calculator.editMix') : t('calculator.title')}
            </h1>
            {selectedMixTitle && (
              <h2 className="text-lg text-gray-600 mt-1">{selectedMixTitle}</h2>
            )}
          </div>
        </div>
        
        {user && (
          <button
            onClick={() => setShowSavedMixes(!showSavedMixes)}
            className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
          >
            {showSavedMixes ? t('calculator.createNewMix') : t('calculator.savedMixes.title')}
          </button>
        )}
      </div>

      {showSavedMixes ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-6">
            {t('calculator.savedMixes.title')}
          </h2>
          <SavedMixes 
            onSelectMix={handleSelectMix} 
            onEditMix={handleEditMix} 
          />
        </div>
      ) : (
        <>
          {!viewMode && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={() => setSelectedCatalog('public')}
                  className={`px-4 py-2 rounded-lg ${
                    selectedCatalog === 'public' 
                      ? 'bg-green-700 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('calculator.publicCatalog')}
                </button>
                {subscription?.tier === 'enterprise' && (
                  <>
                    <button
                      onClick={() => setSelectedCatalog('enterprise')}
                      className={`px-4 py-2 rounded-lg ${
                        selectedCatalog === 'enterprise' 
                          ? 'bg-green-700 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t('calculator.enterpriseCatalog')}
                    </button>
                    <button
                      onClick={() => setSelectedCatalog('private')}
                      className={`px-4 py-2 rounded-lg ${
                        selectedCatalog === 'private' 
                          ? 'bg-green-700 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t('calculator.privateCatalog')}
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <select
                    value={selectedFlourId}
                    onChange={(e) => setSelectedFlourId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{t('calculator.selectFlour')}</option>
                    {flours.map((flour) => (
                      <option key={flour.id} value={flour.id}>
                        {flour.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddFlour}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('calculator.addFlour')}
                </button>
                <button
                  onClick={handleRefresh}
                  className={`p-2 text-gray-600 hover:text-gray-900 ${refreshing ? 'animate-spin' : ''}`}
                  disabled={refreshing}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          <div ref={mixContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('calculator.mixComposition')}</h2>
                {!viewMode && mix.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    title={t('common.reset')}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('common.reset')}
                  </button>
                )}
              </div>
              
              {mix.map((item) => (
                <div key={item.flourId} className="mb-4 p-4 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.flourName}</span>
                      {item.source && (
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getSourceInfo(item.source).color}`}>
                          {getSourceInfo(item.source).icon}
                          <span>{getSourceInfo(item.source).label}</span>
                        </span>
                      )}
                    </div>
                    {!viewMode && (
                      <button
                        onClick={() => handleRemoveFlour(item.flourId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.percentage}
                      onChange={(e) => handlePercentageChange(item.flourId, parseFloat(e.target.value))}
                      disabled={viewMode}
                      className="flex-1"
                    />
                    <span className="w-16 text-right">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}

              {mix.length > 0 && (
                <div className={`p-4 rounded-lg ${
                  isValidMix ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {isValidMix ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span>
                      {t('calculator.total')}: {totalPercentage.toFixed(1)}% 
                      {!isValidMix && ` (${t('calculator.mustBe100')})`}
                    </span>
                  </div>
                </div>
              )}

              {!viewMode && mix.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={!isValidMix}
                    className="w-full px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editMode ? t('calculator.updateMix') : t('calculator.saveMix')}
                  </button>
                </div>
              )}
            </div>

            <div>
              {mix.length > 0 && (
                <>
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('calculator.mixComposition')}</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
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

                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('calculator.nutritionalValues')}</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getNutritionalChartData()}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Detailed Nutritional Values */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {Object.entries(calculateNutritionalValues()).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 capitalize">{key}</div>
                          <div className="font-medium">{value.toFixed(2)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('calculator.proteinComposition')}</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getProteinCompositionChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getProteinCompositionChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Detailed Protein Composition */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {Object.entries(calculateProteinComposition()).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 capitalize">{key}</div>
                          <div className="font-medium">{value.toFixed(2)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enzymatic Composition Section */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('calculator.enzymaticComposition')}</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getEnzymaticCompositionChartData()}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${Number(value).toFixed(3)}`} />
                          <Bar dataKey="value" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Detailed Enzymatic Values */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {Object.entries(calculateEnzymaticComposition()).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 capitalize">{key}</div>
                          <div className="font-medium">{value.toFixed(3)}</div>
                        </div>
                      ))}
                      
                      {/* Total Enzymes */}
                      <div className="p-3 bg-green-50 rounded-lg col-span-2">
                        <div className="text-sm text-gray-600 font-medium">Total Enzymes</div>
                        <div className="font-medium text-green-700">{calculateTotalEnzymes().toFixed(3)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Anti-nutrients Section */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('calculator.antiNutrients')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(calculateAntiNutrients()).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                          <div className="font-medium">{value.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {value <= 1.0 ? 'Low' : value <= 2.0 ? 'Medium' : 'High'}
                          </div>
                        </div>
                      ))}
                      
                      {/* Total Anti-nutrients */}
                      <div className="p-3 bg-green-50 rounded-lg col-span-3">
                        <div className="text-sm text-gray-600 font-medium">Total Anti-nutrients</div>
                        <div className="font-medium text-green-700">{calculateTotalAntiNutrients().toFixed(2)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {calculateTotalAntiNutrients() <= 5.0 ? 'Low' : 
                           calculateTotalAntiNutrients() <= 10.0 ? 'Medium' : 'High'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mechanical Properties Section */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('calculator.mechanicalProperties')}</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(calculateMechanicalProperties()).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{t(`catalog.${key}`)}</span>
                            <span>{value}</span>
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

                  {/* Solubility Section */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">{t('calculator.solubility')}</h2>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">{t('calculator.solubility')}</div>
                      <div className="font-medium capitalize">{calculateSolubility()}</div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 rounded-full"
                          style={{ 
                            width: calculateSolubility() === 'high' ? '75%' : calculateSolubility() === 'medium' ? '50%' : '25%' 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Text Window for Calculator page - Only show when not in Saved Mixes view and mix composition is displayed */}
          {!showSavedMixes && isMixCompositionDisplayed && (
            <div className="relative mt-8">
              <TextWindow page="calculator" />
            </div>
          )}
        </>
      )}

      {showSaveModal && (
        <SaveMixModal
          mix={mix}
          onSave={handleSaveMix}
          onClose={() => setShowSaveModal(false)}
          isEdit={editMode}
          initialName={initialMix?.name}
          initialDescription={initialMix?.description}
          initialTags={initialMix?.tags}
        />
      )}
    </div>
  );
}

export default MixCalculator;
