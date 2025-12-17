import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Check, X, Search, RefreshCw, AlertCircle, Eye, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { SavedMix } from '../types/mix';

interface SavedMixesExportSelectorProps {
  onClose: () => void;
}

function SavedMixesExportSelector({ onClose }: SavedMixesExportSelectorProps) {
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const [selectedMixes, setSelectedMixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchMixes();
  }, [user]);

  const fetchMixes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('saved_mixes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMixes(data || []);
      // By default, select all mixes
      setSelectedMixes(data?.map(mix => mix.id) || []);
    } catch (err) {
      console.error('Error fetching saved mixes:', err);
      setError('Erreur lors de la récupération des mix sauvegardés');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMixes();
    setRefreshing(false);
  };

  const handleToggleSelect = (mixId: string) => {
    setSelectedMixes(prev => 
      prev.includes(mixId) 
        ? prev.filter(id => id !== mixId) 
        : [...prev, mixId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMixes(mixes.map(mix => mix.id));
  };

  const handleDeselectAll = () => {
    setSelectedMixes([]);
  };

  const handleExport = () => {
    if (selectedMixes.length === 0) {
      setError('Veuillez sélectionner au moins un mix à exporter');
      return;
    }

    setExporting(true);
    
    try {
      // Filter mixes to only include selected ones
      const mixesToExport = mixes.filter(mix => selectedMixes.includes(mix.id));
      
      // Create CSV content with all required columns
      const headers = [
        'id',
        'user_id',
        'name',
        'description',
        'composition',
        'created_at',
        'updated_at',
        'tags'
      ].join(';');
      
      const rows = mixesToExport.map(mix => [
        mix.id,
        mix.user_id,
        `"${mix.name}"`,
        `"${mix.description || ''}"`,
        `"${JSON.stringify(mix.composition).replace(/"""""/g, '"')}"`,
        mix.created_at,
        mix.updated_at,
        `"${JSON.stringify(mix.tags || []).replace(/"""""/g, '"')}"`
      ].join(';'));
      
      const csvContent = [headers, ...rows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `saved_mixes_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      
      // Close the selector after successful export
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error exporting mixes:', err);
      setError('Erreur lors de l\'export des mix');
    } finally {
      setExporting(false);
    }
  };

  const filteredMixes = searchTerm 
    ? mixes.filter(mix => 
        mix.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mix.description && mix.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mix.tags && mix.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : mixes;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-800">
              Sélectionner les Mix à Exporter
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un mix..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              disabled={refreshing}
              title="Rafraîchir"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Tout sélectionner
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Tout désélectionner
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {selectedMixes.length} sur {mixes.length} mix sélectionnés
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : filteredMixes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun mix sauvegardé'}
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {filteredMixes.map(mix => (
                <div 
                  key={mix.id} 
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedMixes.includes(mix.id) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => handleToggleSelect(mix.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedMixes.includes(mix.id)}
                          onChange={() => handleToggleSelect(mix.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        {mix.name}
                      </h3>
                      {mix.description && (
                        <p className="text-gray-600 text-sm mt-1">{mix.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(mix.created_at).toLocaleDateString()}
                    </div>
                  </div>
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
                  {mix.tags && mix.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
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
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={selectedMixes.length === 0 || exporting}
              className={`px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2 ${
                selectedMixes.length === 0 ? 'cursor-not-allowed' : ''
              }`}
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exporter {selectedMixes.length} mix{selectedMixes.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavedMixesExportSelector;
