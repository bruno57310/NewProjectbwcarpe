import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Home, AlertCircle, Search, Database, Filter, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

function PublicAntiNutrientContributionViewer() {
  const [contributions, setContributions] = useState<AntiNutrientContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
    fetchContributions();
  }, [user, searchTerm, selectedCategory]);

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

  const fetchContributions = async () => {
    try {
      setLoading(true);
      
      // First, get the flours with their categories
      let query = supabase
        .from('flours')
        .select(`
          id,
          name,
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
      
      const { data: floursData, error: floursError } = await query;
      
      if (floursError) throw floursError;
      
      if (!floursData || floursData.length === 0) {
        setContributions([]);
        setLoading(false);
        return;
      }
      
      // Get the flour IDs
      const flourIds = floursData.map(flour => flour.id);
      
      // Fetch the anti-nutrient contributions from contributionanti_nutrients table
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('publiccontributionanti_nutrients')
        .select('*')
        .in('flour_id', flourIds);
      
      if (contributionsError) throw contributionsError;
      
      // Combine the data
      const enrichedContributions = (contributionsData || []).map(contribution => {
        const flour = floursData.find(f => f.id === contribution.flour_id);
        
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
        
        return {
          ...contribution,
          flour_name: flour?.name || 'Unknown',
          category_name: flour?.flour_categories?.name || 'Uncategorized',
          lectins,
          tannins,
          saponins,
          phytic_acid,
          trypsin_inhibitors
        };
      });
      
      setContributions(enrichedContributions);
    } catch (err) {
      console.error('Error fetching contributions:', err);
      setError('Error loading public anti-nutrient contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchContributions();
    setRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContributions();
  };

  const downloadCSV = () => {
    if (contributions.length === 0) return;
    
    const headers = [
      'ID',
      'Flour ID',
      'Flour Name',
      'Category',
      'Lectins',
      'Tannins',
      'Saponins',
      'Phytic Acid',
      'Trypsin Inhibitors',
      'Total Anti-Nutrients',
      'Created At',
      'Updated At'
    ].join(',');
    
    const rows = contributions.map(contribution => [
      contribution.id,
      contribution.flour_id,
      `"${contribution.flour_name || ''}"`,
      `"${contribution.category_name || ''}"`,
      contribution.lectins || 0,
      contribution.tannins || 0,
      contribution.saponins || 0,
      contribution.phytic_acid || 0,
      contribution.trypsin_inhibitors || 0,
      contribution.anti_nutrients_total_contri || 0,
      contribution.created_at || '',
      contribution.updated_at || ''
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'public_anti_nutrient_contributions.csv';
    link.click();
  };

  if (loading && contributions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
              title="Retour à l'accueil"
            >
              <Home className="w-5 h-5" />
            </Link>
            <h2 className="text-2xl font-bold text-green-800">
              Public Contributions Anti-Nutriments
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={contributions.length === 0}
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Database className="w-5 h-5" />
            <h3 className="font-semibold">À propos des contributions anti-nutriments publiques</h3>
          </div>
          <p className="text-blue-700 text-sm">
            Cette page affiche les valeurs numériques précises des anti-nutriments pour les farines du catalogue public. 
            Ces données sont utilisées pour calculer l'impact des anti-nutriments dans vos mélanges.
            Les valeurs sont exprimées sur une échelle numérique où:
          </p>
          <ul className="list-disc list-inside text-blue-700 text-sm mt-2 ml-4">
            <li>0-1: Niveau faible (low)</li>
            <li>1-2: Niveau moyen (medium)</li>
            <li>2+: Niveau élevé (high)</li>
          </ul>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une farine..."
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
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button 
              type="submit"
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </form>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Farine</th>
                <th className="px-4 py-2">Catégorie</th>
                <th className="px-4 py-2">Lectins</th>
                <th className="px-4 py-2">Tannins</th>
                <th className="px-4 py-2">Saponins</th>
                <th className="px-4 py-2">Phytic Acid</th>
                <th className="px-4 py-2">Trypsin Inhibitors</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{contribution.flour_name}</td>
                  <td className="px-4 py-2">{contribution.category_name}</td>
                  <td className="px-4 py-2">{contribution.lectins.toFixed(2)}</td>
                  <td className="px-4 py-2">{contribution.tannins.toFixed(2)}</td>
                  <td className="px-4 py-2">{contribution.saponins.toFixed(2)}</td>
                  <td className="px-4 py-2">{contribution.phytic_acid.toFixed(2)}</td>
                  <td className="px-4 py-2">{contribution.trypsin_inhibitors.toFixed(2)}</td>
                  <td className="px-4 py-2 font-semibold">{contribution.anti_nutrients_total_contri.toFixed(2)}</td>
                </tr>
              ))}
              {contributions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm || selectedCategory ? 'Aucun résultat trouvé' : 'Aucune donnée disponible'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Total: {contributions.length} contributions
        </div>
      </div>
    </div>
  );
}

export default PublicAntiNutrientContributionViewer;
