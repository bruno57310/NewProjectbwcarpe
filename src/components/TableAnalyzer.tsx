import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Download, AlertCircle, Upload, Info, Eye, Save, X, Plus, RefreshCw, Ban, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SavedMixesExportSelector from './SavedMixesExportSelector';

interface TableData {
  [key: string]: any;
}

interface TableAnalyzerProps {
  onDataChange?: () => void;
}

interface PreviewRow extends TableData {
  _modType?: 'insert' | 'update' | 'ignore';
}

function TableAnalyzer({ onDataChange }: TableAnalyzerProps) {
  const [selectedCatalog, setSelectedCatalog] = useState<'public' | 'enterprise' | 'private'>('enterprise');
  const [selectedTable, setSelectedTable] = useState('flours_template');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());
  const [hasEnterpriseSubscription, setHasEnterpriseSubscription] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showExportSelector, setShowExportSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Check enterprise subscription status and get user email
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('tier, active')
          .eq('user_id', user.id)
          .eq('active', true)
          .single();

        if (error) throw error;

        setHasEnterpriseSubscription(data?.tier === 'enterprise' && data?.active);
        
        // Get user email
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        setUserEmail(userData.user?.email || null);
      } catch (err) {
        console.error('Error checking subscription:', err);
        setHasEnterpriseSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Get table mapping based on selected catalog
  const getTableMapping = () => {
    switch (selectedCatalog) {
      case 'public':
        return {
          'Farines': 'flours',
          'Catégories de Farines': 'flour_categories',
          'Mix Sauvegardés': 'saved_mixes'
        };
      case 'enterprise':
        return {
          'Farines': 'flours_template',
          'Catégories de Farines': 'flour_categories',
          'Mix Sauvegardés': 'saved_mixes'
        };
      case 'private':
        return {
          'Farines': 'private_flours',
          'Catégories de Farines': 'private_flour_categories',
          'Mix Sauvegardés': 'saved_mixes'
        };
      default:
        return {};
    }
  };

  const tableMapping = getTableMapping();
  const tables = Object.entries(tableMapping).map(([label, value]) => ({ 
    id: value, 
    name: label 
  }));

  // Get the current table info
  const getCurrentTableInfo = () => {
    const currentTableName = tables.find(t => t.id === selectedTable)?.name || '';
    return {
      catalog: selectedCatalog,
      displayName: currentTableName,
      tableName: selectedTable
    };
  };

  const tableInfo = getCurrentTableInfo();

  // Fetch existing IDs when table or catalog changes
  useEffect(() => {
    const fetchExistingIds = async () => {
      try {
        const { data, error } = await supabase
          .from(selectedTable)
          .select('id');
        
        if (error) throw error;
        
        if (data) {
          setExistingIds(new Set(data.map(item => item.id)));
        }
      } catch (err) {
        console.error('Error fetching existing IDs:', err);
      }
    };

    if (selectedTable) {
      fetchExistingIds();
    }
  }, [selectedTable, selectedCatalog]);

  const isValidTimestamp = (value: string): boolean => {
    const timestamp = Date.parse(value);
    return !isNaN(timestamp);
  };

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) {
      return '""';
    }

    // Special handling for known JSON fields
    const jsonFields = ['nutritional_values', 'mechanical_properties', 'protein_composition', 'enzymatic_composition', 'anti_nutrients', 'recommended_ratio', 'composition'];
    if (jsonFields.includes(key) && typeof value === 'object') {
      // Format JSON with spaces after colons and commas
      const formattedJson = JSON.stringify(value)
        .replace(/:/g, ': ')
        .replace(/,/g, ', ');
      return `"${formattedJson}"`;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return `"${JSON.stringify(value)}"`;
    }

    // Handle other objects
    if (typeof value === 'object') {
      return `"${JSON.stringify(value)}"`;
    }

    // Handle primitive values
    return `"${String(value)}"`;
  };

  const validateRow = (row: any, headers: string[]): string[] => {
    const errors: string[] = [];

    // Check for required fields based on table
    if (selectedTable === 'flours' || selectedTable === 'flours_template' || selectedTable === 'private_flours') {
      if (!row.name) {
        errors.push('Le champ "name" est requis');
      }
      if (row.protein_profile && !['simple', 'complex'].includes(row.protein_profile)) {
        errors.push('Le champ "protein_profile" doit être "simple" ou "complex"');
      }
      if (row.protein_quality && !['complete', 'incomplete'].includes(row.protein_quality)) {
        errors.push('Le champ "protein_quality" doit être "complete" ou "incomplete"');
      }
      if (row.solubility && !['low', 'medium', 'high'].includes(row.solubility)) {
        errors.push('Le champ "solubility" doit être "low", "medium" ou "high"');
      }
    }

    // For private_flour_categories, name is required
    if (selectedTable === 'private_flour_categories' && !row.name) {
      errors.push('Le champ "name" est requis');
    }

    // Validate JSON fields
    const jsonFields = ['nutritional_values', 'mechanical_properties', 'protein_composition', 'enzymatic_composition', 'anti_nutrients', 'recommended_ratio', 'composition'];
    jsonFields.forEach(field => {
      if (row[field]) {
        try {
          if (typeof row[field] === 'string') {
            JSON.parse(row[field]);
          }
        } catch (e) {
          errors.push(`Le champ "${field}" contient un JSON invalide`);
        }
      }
    });

    return errors;
  };

  const parseValue = (value: string, key: string): any => {
    // Skip created_at and updated_at fields
    if (key === 'created_at' || key === 'updated_at') {
      return undefined;
    }

    // Skip id field for private_flour_categories and saved_mixes
    if (key === 'id' && (selectedTable === 'private_flour_categories' || selectedTable === 'saved_mixes')) {
      return undefined;
    }

    // Skip user_id field for saved_mixes
    if (key === 'user_id' && selectedTable === 'saved_mixes') {
      return undefined;
    }

    if (!value || value === '""') {
      return null;
    }

    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    // Try to parse JSON for object fields
    try {
      if ((value.startsWith('{') && value.endsWith('}')) || 
          (value.startsWith('[') && value.endsWith(']'))) {
        return JSON.parse(value);
      }
    } catch {
      // If parsing fails, return the original value
    }

    return value;
  };

  const downloadCSV = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check enterprise subscription for private tables
      if (selectedCatalog === 'private' && !hasEnterpriseSubscription) {
        throw new Error('Un abonnement Enterprise est requis pour accéder aux tables privées');
      }

      // For saved_mixes table, show the export selector instead of direct download
      if (selectedTable === 'saved_mixes') {
        setShowExportSelector(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(selectedTable)
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('Aucune donnée trouvée dans la table sélectionnée');
        return;
      }

      // Convert data to CSV using semicolons as delimiters
      const headers = Object.keys(data[0]);
      const headerRow = headers.join(';');
      const rows = data.map(row => 
        headers.map(header => formatValue(row[header], header)).join(';')
      );
      const csvContent = [headerRow, ...rows].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedTable}_export.csv`;
      link.click();
      
      setSuccess('Export réussi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewData(null);

    try {
      // Check enterprise subscription for private tables
      if (selectedCatalog === 'private' && !hasEnterpriseSubscription) {
        throw new Error('Un abonnement Enterprise est requis pour accéder aux tables privées');
      }

      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const headers = lines[0].split(';').map(h => h.trim());

        try {
          const errors: string[] = [];
          const processedData = lines.slice(1).map((line, index) => {
            const values = line.split(';').map(v => v.trim());
            const row: { [key: string]: any } = {};
            
            headers.forEach((header, index) => {
              if (index < values.length && header !== 'created_at' && header !== 'updated_at') {
                // Skip id field for private_flour_categories and saved_mixes
                if (!(
                  (selectedTable === 'private_flour_categories' && header === 'id') ||
                  (selectedTable === 'saved_mixes' && header === 'id')
                )) {
                  row[header] = parseValue(values[index], header);
                }
              }
            });

            // For saved_mixes table, always set user_id to current user
            if (selectedTable === 'saved_mixes') {
              row.user_id = user?.id;
            }

            // Validate row data
            const rowErrors = validateRow(row, headers);
            if (rowErrors.length > 0) {
              errors.push(`Ligne ${index + 2}:\n${rowErrors.join('\n')}`);
              return null;
            }
            
            return row;
          }).filter(Boolean) as PreviewRow[];

          // Determine modification type for each row and handle user_id fields
          processedData.forEach(row => {
            // For private_flour_categories table, check user_id_private_category
            if (selectedTable === 'private_flour_categories' && user) {
              // Always set user_id_private_category to current user
              row.user_id_private_category = user.id;
              
              // For private_flour_categories, always treat as insert (let the trigger handle it)
              // Remove id field completely to let the database generate it
              delete row.id;
              row._modType = 'insert';
            }
            // For private_flours table, check user_id_private_flours
            else if (selectedTable === 'private_flours' && user) {
              // Always set user_id_private_flours to current user
              row.user_id_private_flours = user.id;
              
              // If id exists in database, mark as update, otherwise insert
              if (row.id && existingIds.has(row.id)) {
                row._modType = 'update';
              } else {
                // Generate new UUID for new records
                row.id = crypto.randomUUID();
                row._modType = 'insert';
              }
            }
            // For saved_mixes table, always set user_id to current user
            else if (selectedTable === 'saved_mixes' && user) {
              // Always set user_id to current user
              row.user_id = user.id;
              
              // Always treat as insert for saved_mixes
              delete row.id; // Remove id to let the database generate it
              row._modType = 'insert';
            }
            // Now determine the modification type if not already set
            else if (!row._modType) {
              if (row.id) {
                row._modType = existingIds.has(row.id) ? 'update' : 'insert';
              } else {
                // Generate new UUID for new records
                row.id = crypto.randomUUID();
                row._modType = 'insert';
              }
            }
          });

          if (errors.length > 0) {
            throw new Error(`Erreurs de validation:\n${errors.join('\n\n')}`);
          }

          // Set preview data instead of immediately saving
          setPreviewData(processedData);
          setShowPreview(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la validation du fichier');
        } finally {
          setLoading(false);
        }
      };

      reader.readAsText(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'importation');
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!previewData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check enterprise subscription for private tables
      if (selectedCatalog === 'private' && !hasEnterpriseSubscription) {
        throw new Error('Un abonnement Enterprise est requis pour accéder aux tables privées');
      }

      // Split data into inserts and updates
      const insertsData = previewData
        .filter(row => row._modType === 'insert')
        .map(({ _modType, ...rest }) => {
          // For private_flour_categories, ensure user_id_private_category is set
          if (selectedTable === 'private_flour_categories' && user) {
            // Remove id field completely for private_flour_categories
            const { id, ...dataWithoutId } = rest;
            return { ...dataWithoutId, user_id_private_category: user.id };
          }
          // For private_flours, ensure user_id_private_flours is set
          else if (selectedTable === 'private_flours' && user) {
            return { ...rest, user_id_private_flours: user.id };
          }
          // For saved_mixes, ensure user_id is set
          else if (selectedTable === 'saved_mixes' && user) {
            // Remove id field completely for saved_mixes
            const { id, ...dataWithoutId } = rest;
            return { ...dataWithoutId, user_id: user.id };
          }
          return rest;
        });
      
      const updatesData = previewData
        .filter(row => row._modType === 'update')
        .map(({ _modType, ...rest }) => rest);

      // Process inserts if any
      if (insertsData.length > 0) {
        const { error: insertError } = await supabase
          .from(selectedTable)
          .insert(insertsData);

        if (insertError) {
          throw new Error(`Erreur lors de l'insertion des données:\n${insertError.message}\n${insertError.details || ''}`);
        }
      }

      // Process updates if any
      if (updatesData.length > 0) {
        const { error: updateError } = await supabase
          .from(selectedTable)
          .upsert(updatesData, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour des données:\n${updateError.message}\n${updateError.details || ''}`);
        }
      }

      setSuccess(`${previewData.length} lignes traitées avec succès dans ${selectedTable} (${insertsData.length} ajouts, ${updatesData.length} mises à jour)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Close preview
      setShowPreview(false);
      setPreviewData(null);

      // Notify parent component about the data change
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Function to highlight the user_id fields in the preview
  const highlightField = (key: string, modType?: 'insert' | 'update' | 'ignore') => {
    if ((key === 'user_id_private_flours' || key === 'user_id_private_category' || key === 'user_id') && modType === 'insert') {
      return 'bg-yellow-200 font-medium';
    }
    if (key === 'user_id_private_flours' || key === 'user_id_private_category' || key === 'user_id') {
      return 'bg-yellow-100 font-medium';
    }
    if ((key === 'id' && selectedTable === 'private_flour_categories') || 
        (key === 'id' && selectedTable === 'saved_mixes')) {
      return 'bg-red-100 line-through';
    }
    return '';
  };

  // Function to get modification type badge
  const getModTypeBadge = (modType: 'insert' | 'update' | 'ignore') => {
    switch (modType) {
      case 'insert':
        return (
          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">
            <Plus className="w-3 h-3" />
            Ajout
          </span>
        );
      case 'update':
        return (
          <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-medium">
            <RefreshCw className="w-3 h-3" />
            Mise à jour
          </span>
        );
      case 'ignore':
        return (
          <span className="flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">
            <Ban className="w-3 h-3" />
            Ignoré
          </span>
        );
    }
  };

  // Function to edit user_id for a specific row
  const editUserIdForRow = (rowIndex: number, newValue: string) => {
    if (!previewData) return;
    
    const updatedData = [...previewData];
    if (selectedTable === 'private_flour_categories') {
      updatedData[rowIndex].user_id_private_category = newValue;
    } else if (selectedTable === 'private_flours') {
      updatedData[rowIndex].user_id_private_flours = newValue;
    } else if (selectedTable === 'saved_mixes') {
      updatedData[rowIndex].user_id = newValue;
    }
    setPreviewData(updatedData);
  };

  // Check if user is admin (bruno_wendling@orange.fr)
  const isAdmin = userEmail === 'bruno_wendling@orange.fr';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-green-800">
          Export et Import de Données
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 whitespace-pre-wrap">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Choisir Catalogue
          </label>
          <select
            value={selectedCatalog}
            onChange={(e) => {
              setSelectedCatalog(e.target.value as 'public' | 'enterprise' | 'private');
              // Reset selected table when changing catalog
              const newTableMapping = getTableMapping();
              setSelectedTable(Object.values(newTableMapping)[0]);
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={showPreview}
          >
            {/* Only show Public catalog option for bruno_wendling@orange.fr */}
            {isAdmin && <option value="public">Catalogue Public</option>}
            <option value="enterprise">Catalogue Enterprise</option>
            <option value="private">Catalogue Privé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sélectionner une table
          </label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={showPreview}
          >
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table Info Display */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-medium text-blue-800">Configuration Actuelle</h3>
              <div className="text-sm text-blue-700">
                <p><strong>Catalogue:</strong> {tableInfo.catalog.charAt(0).toUpperCase() + tableInfo.catalog.slice(1)}</p>
                <p><strong>Table affichée:</strong> {tableInfo.displayName}</p>
                <p><strong>Nom de la table:</strong> {tableInfo.tableName}</p>
                {(selectedTable === 'private_flours' || selectedTable === 'private_flour_categories') && (
                  <p className="text-blue-800 font-medium mt-2">
                    Note: Les données importées seront automatiquement associées à votre compte utilisateur.
                  </p>
                )}
                {(selectedTable === 'private_flour_categories' || selectedTable === 'saved_mixes') && (
                  <p className="text-blue-800 font-medium mt-2">
                    Note: Le champ 'id' est géré automatiquement par la base de données et sera ignoré lors de l'import.
                  </p>
                )}
                {selectedTable === 'saved_mixes' && (
                  <p className="text-blue-800 font-medium mt-2">
                    Note: Le champ 'user_id' sera automatiquement remplacé par votre ID utilisateur lors de l'import.
                  </p>
                )}
                {selectedCatalog === 'private' && !hasEnterpriseSubscription && (
                  <p className="text-red-600 font-medium mt-2">
                    ⚠️ Un abonnement Enterprise est requis pour accéder aux tables privées.
                  </p>
                )}
                {userEmail && (
                  <p className="text-green-700 font-medium mt-2">
                    Utilisateur connecté: {userEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={downloadCSV}
            disabled={loading || showPreview || (selectedCatalog === 'private' && !hasEnterpriseSubscription)}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exporter en CSV
              </>
            )}
          </button>

          <label className={`flex items-center gap-2 px-4 py-2 ${showPreview || (selectedCatalog === 'private' && !hasEnterpriseSubscription) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'} rounded-lg transition-colors`}>
            <Upload className="w-4 h-4" />
            {loading ? 'Import en cours...' : 'Importer un CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading || showPreview || (selectedCatalog === 'private' && !hasEnterpriseSubscription)}
              className="hidden"
              ref={fileInputRef}
            />
          </label>
        </div>

        {/* Preview Section */}
        {showPreview && previewData && (
          <div className="mt-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Aperçu des modifications ({previewData.length} lignes)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={cancelPreview}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={saveChanges}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-3 py-2 border border-blue-200 w-24">Type</th>
                    {previewData.length > 0 && Object.keys(previewData[0])
                      .filter(key => key !== '_modType')
                      .map((key) => (
                        <th key={key} className={`px-3 py-2 border border-blue-200 ${highlightField(key)}`}>
                          {key}
                          {(key === 'user_id_private_flours' || key === 'user_id_private_category' || key === 'user_id') && (
                            <span className="ml-1 text-yellow-600">*</span>
                          )}
                          {((key === 'id' && selectedTable === 'private_flour_categories') || 
                            (key === 'id' && selectedTable === 'saved_mixes')) && (
                            <span className="ml-1 text-red-600">(ignoré)</span>
                          )}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                      <td className="px-3 py-2 border border-blue-200">
                        {row._modType && getModTypeBadge(row._modType)}
                      </td>
                      {Object.entries(row)
                        .filter(([key]) => key !== '_modType')
                        .map(([key, value], cellIndex) => (
                          <td 
                            key={`${rowIndex}-${cellIndex}`} 
                            className={`px-3 py-2 border border-blue-200 ${highlightField(key, row._modType)}`}
                          >
                            {(key === 'user_id_private_flours' || key === 'user_id_private_category' || key === 'user_id') && row._modType === 'insert' ? (
                              <div className="flex items-center gap-2">
                                <span>{user?.id}</span>
                                <span className="text-xs text-green-700">(Ajouté automatiquement)</span>
                                {userEmail && (
                                  <span className="text-xs text-blue-600">({userEmail})</span>
                                )}
                              </div>
                            ) : ((key === 'id' && selectedTable === 'private_flour_categories') || 
                                 (key === 'id' && selectedTable === 'saved_mixes')) ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 line-through">{value || 'null'}</span>
                                <span className="text-xs text-red-600">(Sera ignoré)</span>
                              </div>
                            ) : (
                              typeof value === 'object' ? (
                                value === null ? 'null' : JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                              ) : (
                                String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')
                              )
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <div className="text-center py-2 text-blue-600 italic">
                  Affichage des 10 premières lignes sur {previewData.length} au total
                </div>
              )}
            </div>
            
            <div className="mt-4 bg-blue-100 p-3 rounded text-blue-800 text-sm">
              <p className="font-medium">Informations importantes :</p>
              <ul className="list-disc list-inside mt-1">
                <li>Vérifiez que les données sont correctes avant de sauvegarder</li>
                <li>Les lignes avec des erreurs ont été filtrées</li>
                <li>
                  <span className="font-medium">Types de modifications :</span>
                  <ul className="ml-6 mt-1 space-y-1">
                    <li className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Plus className="w-3 h-3" />
                        Ajout
                      </span>
                      <span className="ml-2">- Nouvelle entrée qui sera ajoutée</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-medium">
                        <RefreshCw className="w-3 h-3" />
                        Mise à jour
                      </span>
                      <span className="ml-2">- Entrée existante qui sera mise à jour</span>
                    </li>
                  </ul>
                </li>
                {selectedTable === 'saved_mixes' && (
                  <li className="font-medium text-green-700">
                    Pour les nouvelles entrées (type "Ajout"), le champ <span className="bg-yellow-200 px-1 py-0.5 rounded">
                      user_id
                    </span> sera automatiquement défini avec votre ID utilisateur {userEmail && `(${userEmail})`}.
                  </li>
                )}
                {(selectedTable === 'private_flour_categories' || selectedTable === 'saved_mixes') && (
                  <li className="font-medium text-red-700">
                    Le champ <span className="bg-red-100 px-1 py-0.5 rounded">id</span> est géré automatiquement par la base de données et sera ignoré lors de l'import.
                  </li>
                )}
                {(selectedTable === 'private_flours' || selectedTable === 'private_flour_categories' || selectedTable === 'saved_mixes') && (
                  <li className="font-medium text-green-700">
                    Si le champ <span className="bg-yellow-200 px-1 py-0.5 rounded">
                      {selectedTable === 'private_flours' ? 'user_id_private_flours' : 
                       selectedTable === 'private_flour_categories' ? 'user_id_private_category' : 
                       'user_id'}
                    </span> est différent de votre ID utilisateur, l'entrée sera traitée comme un nouvel ajout avec votre ID.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Notes :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Le fichier CSV généré contiendra toutes les colonnes de la table</li>
            <li>Les données JSON seront correctement formatées pour la réimportation</li>
            <li>Les champs created_at et updated_at sont ignorés lors de l'import</li>
            <li>Pour l'import, utilisez un fichier CSV généré par l'export pour garantir la compatibilité</li>
            <li>Le délimiteur de champs utilisé est le point-virgule (;)</li>
            <li>Les données existantes seront mises à jour en utilisant l'ID comme clé</li>
          </ul>
        </div>
      </div>

      {/* Export Selector Modal */}
      {showExportSelector && (
        <SavedMixesExportSelector onClose={() => setShowExportSelector(false)} />
      )}
    </div>
  );
}

export default TableAnalyzer;
