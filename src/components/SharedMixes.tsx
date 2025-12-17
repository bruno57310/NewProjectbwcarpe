import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Eye, 
  User, 
  Calendar, 
  Tag, 
  AlertCircle, 
  RefreshCw, 
  Home,
  Database,
  Lock,
  Book,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface SharedMix {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  composition: {
    flourId: string;
    percentage: number;
    flourName: string;
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
  }[];
  tags: string[] | null;
  shared_at: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
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

function SharedMixes() {
  const [sharedMixes, setSharedMixes] = useState<SharedMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMix, setSelectedMix] = useState<SharedMix | null>(null);
  const [flourDetails, setFlourDetails] = useState<Record<string, FlourDetails>>({});
  const [antiNutrientContributions, setAntiNutrientContributions] = useState<Record<string, any>>({});
  const [enzymeContributions, setEnzymeContributions] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchSharedMixes();
  }, []);

  const fetchSharedMixes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching shared mixes...');
      
      const { data, error } = await supabase
        .from('saved_mixes_shared')
        .select('*')
        .order('shared_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('📊 Shared mixes fetched:', data?.length || 0);
      
      // Get user emails for the shared mixes
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(mix => mix.user_id))];
        
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-emails`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds })
          });
          
          if (response.ok) {
            const userEmails = await response.json();
            const emailMap = userEmails.reduce((acc: any, user: any) => {
              acc[user.id] = user.email;
              return acc;
            }, {});
            
            const enrichedMixes = data.map(mix => ({
              ...mix,
              user_email: emailMap[mix.user_id] || 'Unknown'
            }));
            
            setSharedMixes(enrichedMixes);
          } else {
            setSharedMixes(data);
          }
        } catch (emailError) {
          console.error('Error fetching user emails:', emailError);
          setSharedMixes(data);
        }
      } else {
        setSharedMixes([]);
      }
    } catch (err) {
      console.error('Error fetching shared mixes:', err);
      setError('Erreur lors du chargement des mixes partagés');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSharedMixes();
    setRefreshing(false);
  };

  const handleViewDetails = async (mix: SharedMix) => {
    console.log('🔍 Fetching contributions for shared mix:', mix.name);
    console.log('👤 Mix owner:', mix.user_email);
    console.log('🧪 Mix composition:', mix.composition);
    
    setSelectedMix(mix);
    setLoadingDetails(true);
    
    try {
      // Get flour IDs from the mix composition
      const flourIds = mix.composition.map(item => item.flourId);
      console.log('🌾 Flour IDs in mix:', flourIds);
      
      // Try to fetch flour details from multiple sources
      const details: Record<string, FlourDetails> = {};
      
      // 1. Try public flours first
      console.log('📚 Fetching from public flours...');
      const { data: publicFlours, error: publicError } = await supabase
        .from('flours')
        .select('*')
        .in('id', flourIds);
      
      if (publicError) {
        console.error('❌ Error fetching public flours:', publicError);
      } else {
        console.log('✅ Public flours found:', publicFlours?.length || 0);
        publicFlours?.forEach(flour => {
          details[flour.id] = flour;
        });
      }
      
      // 2. Try enterprise flours
      console.log('🏢 Fetching from enterprise flours...');
      const { data: enterpriseFlours, error: enterpriseError } = await supabase
        .from('flours_template')
        .select('*')
        .in('id', flourIds);
      
      if (enterpriseError) {
        console.error('❌ Error fetching enterprise flours:', enterpriseError);
      } else {
        console.log('✅ Enterprise flours found:', enterpriseFlours?.length || 0);
        enterpriseFlours?.forEach(flour => {
          details[flour.id] = flour;
        });
      }
      
      // 3. Try private flours (this will likely fail for other users)
      console.log('🔒 Fetching from private flours...');
      const { data: privateFlours, error: privateError } = await supabase
        .from('private_flours')
        .select('*')
        .in('id', flourIds);
      
      if (privateError) {
        console.error('❌ Error fetching private flours (expected for other users):', privateError);
      } else {
        console.log('✅ Private flours found:', privateFlours?.length || 0);
        privateFlours?.forEach(flour => {
          details[flour.id] = flour;
        });
      }
      
      setFlourDetails(details);
      console.log('📋 Total flour details collected:', Object.keys(details).length);
      
      // Now fetch contribution data
      await fetchContributionData(flourIds, mix);
      
    } catch (err) {
      console.error('❌ Error fetching mix details:', err);
      setError('Erreur lors du chargement des détails du mix');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchContributionData = async (flourIds: string[], mix: SharedMix) => {
    // Try to fetch anti-nutrient contributions from multiple sources
    const antiNutrientMap: Record<string, any> = {};
    const enzymeMap: Record<string, any> = {};
    
    // 1. Try public anti-nutrient contributions first
    try {
      const { data: publicAntiNutrients, error: publicAntiError } = await supabase
        .from('publiccontributionanti_nutrients')
        .select('*')
        .in('flour_id', flourIds);
      
      if (publicAntiError) {
        console.error('Error fetching public anti-nutrients:', publicAntiError);
      } else {
        publicAntiNutrients?.forEach(contribution => {
          antiNutrientMap[contribution.flour_id] = contribution;
        });
      }
    } catch (err) {
      console.error('Error in public anti-nutrient fetch:', err);
    }
    
    // 2. Try enterprise anti-nutrient contributions (this might fail due to RLS)
    try {
      const { data: enterpriseAntiNutrients, error: enterpriseAntiError } = await supabase
        .from('contributionanti_nutrients')
        .select('*')
        .in('flour_id', flourIds);
      
      if (enterpriseAntiError) {
        console.error('Error fetching enterprise anti-nutrients (expected for non-admin users):', enterpriseAntiError);
      } else {
        enterpriseAntiNutrients?.forEach(contribution => {
          antiNutrientMap[contribution.flour_id] = contribution;
        });
      }
    } catch (err) {
      console.error('Error in enterprise anti-nutrient fetch:', err);
    }
    
    // 3. Try public enzyme contributions first
    try {
      const { data: publicEnzymes, error: publicEnzymeError } = await supabase
        .from('publiccontributionenzymes')
        .select('*')
        .in('flour_id', flourIds);
      
      if (publicEnzymeError) {
        console.error('Error fetching public enzymes:', publicEnzymeError);
      } else {
        publicEnzymes?.forEach(contribution => {
          enzymeMap[contribution.flour_id] = contribution;
        });
      }
    } catch (err) {
      console.error('Error in public enzyme fetch:', err);
    }
    
    // 4. Try enterprise enzyme contributions (this might fail due to RLS)
    try {
      const { data: enterpriseEnzymes, error: enterpriseEnzymeError } = await supabase
        .from('contributionenzymes')
        .select('*')
        .in('flour_id', flourIds);
      
      if (enterpriseEnzymeError) {
        console.error('Error fetching enterprise enzymes (expected for non-admin users):', enterpriseEnzymeError);
      } else {
        enterpriseEnzymes?.forEach(contribution => {
          enzymeMap[contribution.flour_id] = contribution;
        });
      }
    } catch (err) {
      console.error('Error in enterprise enzyme fetch:', err);
    }
    
    setAntiNutrientContributions(antiNutrientMap);
    setEnzymeContributions(enzymeMap);
  };

  // Calculate nutritional values for the mix
  const calculateNutritionalValues = (composition: SharedMix['composition']) => {
    if (composition.length === 0 || Object.keys(flourDetails).length === 0) {
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

    composition.forEach(item => {
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

  // Calculate protein composition for the mix
  const calculateProteinComposition = (composition: SharedMix['composition']) => {
    if (composition.length === 0 || Object.keys(flourDetails).length === 0) {
      return {
        albumins: 0,
        globulins: 0,
        prolamins: 0,
        glutelins: 0
      };
    }

    const proteinComposition = {
      albumins: 0,
      globulins: 0,
      prolamins: 0,
      glutelins: 0
    };

    let totalProteinContribution = 0;

    composition.forEach(item => {
      const flour = flourDetails[item.flourId];
      if (flour && flour.protein_composition && flour.nutritional_values) {
        const proteinContribution = (flour.nutritional_values.proteins * item.percentage) / 100;
        totalProteinContribution += proteinContribution;
        
        proteinComposition.albumins += (flour.protein_composition.albumins / 100) * proteinContribution;
        proteinComposition.globulins += (flour.protein_composition.globulins / 100) * proteinContribution;
        proteinComposition.prolamins += (flour.protein_composition.prolamins / 100) * proteinContribution;
        proteinComposition.glutelins += (flour.protein_composition.glutelins / 100) * proteinContribution;
      }
    });

    // Normalize to percentages if there's any protein
    if (totalProteinContribution > 0) {
      proteinComposition.albumins = (proteinComposition.albumins / totalProteinContribution) * 100;
      proteinComposition.globulins = (proteinComposition.globulins / totalProteinContribution) * 100;
      proteinComposition.prolamins = (proteinComposition.prolamins / totalProteinContribution) * 100;
      proteinComposition.glutelins = (proteinComposition.glutelins / totalProteinContribution) * 100;
    }

    return proteinComposition;
  };

  // Calculate enzymatic composition for the mix
  const calculateEnzymaticComposition = (composition: SharedMix['composition']) => {
    const enzymes = {
      amylases: 0,
      proteases: 0,
      lipases: 0,
      phytases: 0
    };

    composition.forEach(item => {
      const percentage = item.percentage / 100;
      
      // Get contribution data for this flour
      const contribution = enzymeContributions[item.flourId];
      
      if (contribution?.contribution_enzymesyall) {
        Object.keys(enzymes).forEach(key => {
          enzymes[key as keyof typeof enzymes] += 
            (contribution.contribution_enzymesyall[key] || 0) * percentage;
        });
      } else if (contribution) {
        enzymes.amylases += (contribution.amylases || 0) * percentage;
        enzymes.proteases += (contribution.proteases || 0) * percentage;
        enzymes.lipases += (contribution.lipases || 0) * percentage;
        enzymes.phytases += (contribution.phytases || 0) * percentage;
      } else {
        const flourData = flourDetails[item.flourId];
        if (flourData?.enzymatic_composition) {
          Object.keys(enzymes).forEach(key => {
            enzymes[key as keyof typeof enzymes] += 
              (flourData.enzymatic_composition[key] || 0) * percentage;
          });
        }
      }
    });

    return enzymes;
  };

  // Calculate total enzymes using the same logic as MixCalculator
  const calculateTotalEnzymes = (composition: SharedMix['composition']) => {
    const enzymes = calculateEnzymaticComposition(composition);
    return Object.values(enzymes).reduce((sum, value) => sum + value, 0);
  };

  // Calculate anti-nutrients for the mix
  const calculateAntiNutrients = (composition: SharedMix['composition']) => {
    const nutrients = {
      lectins: 0,
      tannins: 0,
      saponins: 0,
      phytic_acid: 0,
      trypsin_inhibitors: 0
    };

    composition.forEach(item => {
      const percentage = item.percentage / 100;
      
      // Get contribution data for this flour
      const contribution = antiNutrientContributions[item.flourId];
      
      if (contribution?.contribution_anti_nutrientsyall) {
        Object.keys(nutrients).forEach(key => {
          nutrients[key as keyof typeof nutrients] += 
            (contribution.contribution_anti_nutrientsyall[key] || 0) * percentage;
        });
      } else if (contribution) {
        nutrients.lectins += (contribution.lectins || 0) * percentage;
        nutrients.tannins += (contribution.tannins || 0) * percentage;
        nutrients.saponins += (contribution.saponins || 0) * percentage;
        nutrients.phytic_acid += (contribution.phytic_acid || 0) * percentage;
        nutrients.trypsin_inhibitors += (contribution.trypsin_inhibitors || 0) * percentage;
      } else {
        const flourData = flourDetails[item.flourId];
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

    return nutrients;
  };

  const calculateTotalAntiNutrients = (composition: SharedMix['composition']) => {
    const nutrients = calculateAntiNutrients(composition);
    return Object.values(nutrients).reduce((sum, value) => sum + value, 0);
  };

  // Calculate mechanical properties for the mix
  const calculateMechanicalProperties = (composition: SharedMix['composition']) => {
    if (composition.length === 0 || Object.keys(flourDetails).length === 0) {
      return {
        binding: 'medium',
        stickiness: 'medium',
        water_absorption: 'medium'
      };
    }

    const getNumericValue = (value: string): number => {
      switch (value) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    };

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

    composition.forEach(item => {
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

  // Calculate solubility for the mix
  const calculateSolubility = (composition: SharedMix['composition']) => {
    if (composition.length === 0 || Object.keys(flourDetails).length === 0) {
      return 'medium';
    }

    const getNumericValue = (value: string): number => {
      switch (value) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    };

    const getTextValue = (value: number): string => {
      if (value > 2.5) return 'high';
      if (value > 1.5) return 'medium';
      return 'low';
    };

    let solubilityValue = 0;

    composition.forEach(item => {
      const flour = flourDetails[item.flourId];
      if (flour && flour.solubility) {
        solubilityValue += (getNumericValue(flour.solubility) * item.percentage) / 100;
      }
    });

    return getTextValue(solubilityValue);
  };

  // Prepare data for charts
  const getPieChartData = (composition: SharedMix['composition']) => {
    return composition.map(item => ({
      name: item.flourName,
      value: item.percentage
    }));
  };

  const getNutritionalChartData = (composition: SharedMix['composition']) => {
    const values = calculateNutritionalValues(composition);
    return [
      { name: 'Protéines', value: values.proteins },
      { name: 'Lipides', value: values.lipids },
      { name: 'Glucides', value: values.carbs },
      { name: 'Fibres', value: values.fiber },
      { name: 'Humidité', value: values.moisture },
      { name: 'Cendres', value: values.ash }
    ];
  };

  const getProteinCompositionChartData = (composition: SharedMix['composition']) => {
    const proteinComposition = calculateProteinComposition(composition);
    return [
      { name: 'Albumines', value: proteinComposition.albumins },
      { name: 'Globulines', value: proteinComposition.globulins },
      { name: 'Prolamines', value: proteinComposition.prolamins },
      { name: 'Glutélines', value: proteinComposition.glutelins }
    ];
  };

  const getEnzymaticCompositionChartData = (composition: SharedMix['composition']) => {
    const enzymes = calculateEnzymaticComposition(composition);
    return [
      { name: 'Amylases', value: enzymes.amylases },
      { name: 'Protéases', value: enzymes.proteases },
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
          label: "Enterprise",
          color: "bg-purple-100 text-purple-800"
        };
      case 'private':
        return {
          icon: <Lock className="w-4 h-4 text-blue-600" />,
          label: "Privé",
          color: "bg-blue-100 text-blue-800"
        };
      case 'public':
      default:
        return {
          icon: <Book className="w-4 h-4 text-green-600" />,
          label: "Public",
          color: "bg-green-100 text-green-800"
        };
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
          title="Retour à l'accueil"
        >
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-green-800">
          Mixes Partagés
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">À propos des Mixes Partagés</h3>
        <p className="text-blue-700 text-sm">
          Découvrez les créations de la communauté ! Ces mixes ont été partagés par d'autres utilisateurs 
          pour vous inspirer dans vos propres créations. Vous pouvez voir leur composition détaillée 
          et leurs propriétés nutritionnelles.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-green-800">
          {sharedMixes.length} mix{sharedMixes.length > 1 ? 's' : ''} partagé{sharedMixes.length > 1 ? 's' : ''}
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {sharedMixes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun mix partagé pour le moment.</p>
          <p className="mt-2 text-sm">Soyez le premier à partager un mix avec la communauté !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedMixes.map(mix => (
            <div key={mix.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-green-800">{mix.name}</h3>
                    {mix.description && (
                      <p className="text-gray-600 mt-1">{mix.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <User className="w-4 h-4" />
                  <span>Par {mix.user_email || 'Utilisateur inconnu'}</span>
                  <span>•</span>
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(mix.shared_at).toLocaleDateString()}</span>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Composition :</h4>
                  <div className="space-y-2">
                    {mix.composition.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.flourName}</span>
                          {item.source && (
                            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getSourceInfo(item.source).color}`}>
                              {getSourceInfo(item.source).icon}
                              <span>{getSourceInfo(item.source).label}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">{item.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                    {mix.composition.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{mix.composition.length - 3} autres farines...
                      </div>
                    )}
                  </div>
                </div>
                
                {mix.tags && mix.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
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
                
                <button
                  onClick={() => handleViewDetails(mix)}
                  className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Voir les détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mix Details Modal */}
      {selectedMix && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-green-800">{selectedMix.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <User className="w-4 h-4" />
                    <span>Créé par {selectedMix.user_email || 'Utilisateur inconnu'}</span>
                    <span>•</span>
                    <Calendar className="w-4 h-4" />
                    <span>Partagé le {new Date(selectedMix.shared_at).toLocaleDateString()}</span>
                  </div>
                  {selectedMix.description && (
                    <p className="text-gray-600 mt-2">{selectedMix.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMix(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Composition */}
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-4">Composition du Mix</h3>
                    <div className="space-y-3">
                      {selectedMix.composition.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.flourName}</span>
                            {item.source && (
                              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getSourceInfo(item.source).color}`}>
                                {getSourceInfo(item.source).icon}
                                <span>{getSourceInfo(item.source).label}</span>
                              </span>
                            )}
                          </div>
                          <span className="font-semibold">{item.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Pie Chart */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-2">Répartition</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getPieChartData(selectedMix.composition)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getPieChartData(selectedMix.composition).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Analysis */}
                  <div className="space-y-6">
                    {/* Nutritional Values */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-4">Valeurs Nutritionnelles</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getNutritionalChartData(selectedMix.composition)}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {Object.entries(calculateNutritionalValues(selectedMix.composition)).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 capitalize">{key}</div>
                            <div className="font-medium">{value.toFixed(2)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Protein Composition */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-4">Composition Protéique</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getProteinCompositionChartData(selectedMix.composition)}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                            <Bar dataKey="value" fill="#00C49F" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {Object.entries(calculateProteinComposition(selectedMix.composition)).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 capitalize">{key}</div>
                            <div className="font-medium">{value.toFixed(2)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enzymatic Composition */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-4">Composition Enzymatique</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getEnzymaticCompositionChartData(selectedMix.composition)}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${Number(value).toFixed(3)}`} />
                            <Bar dataKey="value" fill="#FFBB28" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {Object.entries(calculateEnzymaticComposition(selectedMix.composition)).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 capitalize">{key}</div>
                            <div className="font-medium">{value.toFixed(3)}</div>
                          </div>
                        ))}
                        
                        <div className="p-3 bg-green-50 rounded-lg col-span-2">
                          <div className="text-sm text-gray-600 font-medium">Total Enzymes</div>
                          <div className="font-medium text-green-700">{calculateTotalEnzymes(selectedMix.composition).toFixed(3)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Anti-nutrients */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-4">Anti-nutriments</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(calculateAntiNutrients(selectedMix.composition)).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                            <div className="font-medium">{value.toFixed(2)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {value <= 1.0 ? 'Faible' : value <= 2.0 ? 'Moyen' : 'Élevé'}
                            </div>
                          </div>
                        ))}
                        
                        <div className="p-3 bg-green-50 rounded-lg col-span-3">
                          <div className="text-sm text-gray-600 font-medium">Total Anti-nutriments</div>
                          <div className="font-medium text-green-700">{calculateTotalAntiNutrients(selectedMix.composition).toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {calculateTotalAntiNutrients(selectedMix.composition) <= 5.0 ? 'Faible' : 
                             calculateTotalAntiNutrients(selectedMix.composition) <= 10.0 ? 'Moyen' : 'Élevé'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mechanical Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 mb-4">Propriétés Mécaniques</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(calculateMechanicalProperties(selectedMix.composition)).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
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
                      <h3 className="text-lg font-semibold text-green-700 mb-4">Solubilité</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Solubilité</div>
                        <div className="font-medium capitalize">{calculateSolubility(selectedMix.composition)}</div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full"
                            style={{ 
                              width: calculateSolubility(selectedMix.composition) === 'high' ? '75%' : 
                                     calculateSolubility(selectedMix.composition) === 'medium' ? '50%' : '25%' 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedMix.tags && selectedMix.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Tags :</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMix.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedMixes;
