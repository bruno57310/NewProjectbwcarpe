import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Upload, Home, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Flour } from '../types/flour';

function FlourListCSV() {
  const [flours, setFlours] = useState<Flour[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFlours = async () => {
    try {
      const { data, error } = await supabase
        .from('flours')
        .select(`
          *,
          flour_categories (
            name
          )
        `);

      if (error) throw error;
      
      if (data) {
        setFlours(data.map(flour => ({
          ...flour,
          category: flour.flour_categories?.name || 'Non catégorisé'
        })));
      }
    } catch (error) {
      console.error('Error fetching flours:', error);
      setError('Erreur lors de la récupération des farines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlours();
  }, []);

  const downloadCSV = () => {
    const headers = [
      'ID',
      'Nom',
      'Catégorie',
      'Description',
      'Protéines (%)',
      'Lipides (%)',
      'Glucides (%)',
      'Fibres (%)',
      'Humidité (%)',
      'Cendres (%)',
      'Albumines (%)',
      'Globulines (%)',
      'Prolamines (%)',
      'Glutélines (%)',
      'Amylases (%)',
      'Protéases (%)',
      'Lipases (%)',
      'Phytases (%)',
      'Acide Phytique',
      'Tanins',
      'Inhibiteurs de Trypsine',
      'Saponines',
      'Lectines',
      'Profil Protéique',
      'Qualité Protéique',
      'Liaison',
      'Collant',
      'Absorption d\'eau',
      'Solubilité',
      'Ratio Min (%)',
      'Ratio Max (%)',
      'Prix au kg',
      'Image URL',
      'Date de création',
      'Date de mise à jour'
    ].join(',');

    const rows = flours.map(flour => [
      flour.id,
      `"${flour.name}"`,
      `"${flour.category}"`,
      `"${flour.description || ''}"`,
      flour.nutritional_values.proteins,
      flour.nutritional_values.lipids,
      flour.nutritional_values.carbs,
      flour.nutritional_values.fiber,
      flour.nutritional_values.moisture,
      flour.nutritional_values.ash,
      flour.protein_composition.albumins,
      flour.protein_composition.globulins,
      flour.protein_composition.prolamins,
      flour.protein_composition.glutelins,
      flour.enzymatic_composition.amylases,
      flour.enzymatic_composition.proteases,
      flour.enzymatic_composition.lipases,
      flour.enzymatic_composition.phytases,
      flour.anti_nutrients.phytic_acid,
      flour.anti_nutrients.tannins,
      flour.anti_nutrients.trypsin_inhibitors,
      flour.anti_nutrients.saponins,
      flour.anti_nutrients.lectins,
      flour.protein_profile,
      flour.protein_quality,
      flour.mechanical_properties.binding,
      flour.mechanical_properties.stickiness,
      flour.mechanical_properties.water_absorption,
      flour.solubility,
      flour.recommended_ratio.min,
      flour.recommended_ratio.max,
      flour.price_per_kg || '',
      `"${flour.image_url || ''}"`,
      flour.created_at ? new Date(flour.created_at).toISOString() : '',
      flour.updated_at ? new Date(flour.updated_at).toISOString() : ''
    ].join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'liste_farines_complete.csv';
    link.click();
  };

  const validateLevel = (value: string): 'low' | 'medium' | 'high' => {
    const level = value.toLowerCase();
    if (!['low', 'medium', 'high'].includes(level)) {
      throw new Error(`Niveau invalide : ${value}. Valeurs acceptées : low, medium, high`);
    }
    return level as 'low' | 'medium' | 'high';
  };

  const validateProteinProfile = (value: string): 'simple' | 'complex' => {
    const profile = value.toLowerCase();
    if (!['simple', 'complex'].includes(profile)) {
      throw new Error(`Profil protéique invalide : ${value}. Valeurs acceptées : simple, complex`);
    }
    return profile as 'simple' | 'complex';
  };

  const validateProteinQuality = (value: string): 'complete' | 'incomplete' => {
    const quality = value.toLowerCase();
    if (!['complete', 'incomplete'].includes(quality)) {
      throw new Error(`Qualité protéique invalide : ${value}. Valeurs acceptées : complete, incomplete`);
    }
    return quality as 'complete' | 'incomplete';
  };

  const validatePercentage = (value: string): number => {
    const num = Number(value);
    if (isNaN(num) || num < 0 || num > 100) {
      throw new Error(`Pourcentage invalide : ${value}. Doit être entre 0 et 100`);
    }
    return num;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const headers = lines[0].split(',').map(h => h.trim());

        try {
          let updatedCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          // Process data line by line
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const id = values[headers.indexOf('ID')];
            
            if (!id) {
              errors.push(`Ligne ${i + 1}: ID manquant`);
              errorCount++;
              continue;
            }

            try {
              // Build update object with proper validation
              const updateData = {
                name: values[headers.indexOf('Nom')],
                description: values[headers.indexOf('Description')] || null,
                protein_profile: validateProteinProfile(values[headers.indexOf('Profil Protéique')]),
                protein_quality: validateProteinQuality(values[headers.indexOf('Qualité Protéique')]),
                solubility: validateLevel(values[headers.indexOf('Solubilité')]),
                nutritional_values: {
                  proteins: validatePercentage(values[headers.indexOf('Protéines (%)')]),
                  lipids: validatePercentage(values[headers.indexOf('Lipides (%)')]),
                  carbs: validatePercentage(values[headers.indexOf('Glucides (%)')]),
                  fiber: validatePercentage(values[headers.indexOf('Fibres (%)')]),
                  moisture: validatePercentage(values[headers.indexOf('Humidité (%)')]),
                  ash: validatePercentage(values[headers.indexOf('Cendres (%)')]
                )},
                protein_composition: {
                  albumins: validatePercentage(values[headers.indexOf('Albumines (%)')]),
                  globulins: validatePercentage(values[headers.indexOf('Globulines (%)')]),
                  prolamins: validatePercentage(values[headers.indexOf('Prolamines (%)')]),
                  glutelins: validatePercentage(values[headers.indexOf('Glutélines (%)')])
                },
                enzymatic_composition: {
                  amylases: validatePercentage(values[headers.indexOf('Amylases (%)')]),
                  proteases: validatePercentage(values[headers.indexOf('Protéases (%)')]),
                  lipases: validatePercentage(values[headers.indexOf('Lipases (%)')]),
                  phytases: validatePercentage(values[headers.indexOf('Phytases (%)')])
                },
                mechanical_properties: {
                  binding: validateLevel(values[headers.indexOf('Liaison')]),
                  stickiness: validateLevel(values[headers.indexOf('Collant')]),
                  water_absorption: validateLevel(values[headers.indexOf('Absorption d\'eau')])
                },
                anti_nutrients: {
                  phytic_acid: validateLevel(values[headers.indexOf('Acide Phytique')]),
                  tannins: validateLevel(values[headers.indexOf('Tanins')]),
                  trypsin_inhibitors: validateLevel(values[headers.indexOf('Inhibiteurs de Trypsine')]),
                  saponins: validateLevel(values[headers.indexOf('Saponines')]),
                  lectins: validateLevel(values[headers.indexOf('Lectines')])
                },
                recommended_ratio: {
                  min: validatePercentage(values[headers.indexOf('Ratio Min (%)')]),
                  max: validatePercentage(values[headers.indexOf('Ratio Max (%)')])
                },
                price_per_kg: values[headers.indexOf('Prix au kg')] ? Number(values[headers.indexOf('Prix au kg')]) : null,
                image_url: values[headers.indexOf('Image URL')] || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // Update flour
              const { error: updateError } = await supabase
                .from('flours')
                .update(updateData)
                .eq('id', id);

              if (updateError) throw updateError;
              updatedCount++;
            } catch (err) {
              errorCount++;
              errors.push(`Ligne ${i + 1}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            }
          }

          // Refresh data
          await fetchFlours();
          
          if (errorCount > 0) {
            setError(`${errorCount} erreur(s) lors de la mise à jour:\n${errors.join('\n')}\n\n${updatedCount} farine(s) mise(s) à jour avec succès.`);
          } else {
            setSuccess(`${updatedCount} farine(s) mise(s) à jour avec succès.`);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la validation du fichier');
        }
      };

      reader.readAsText(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'importation');
    } finally {
      setImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto px-4 py-8">
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
              Liste des Farines
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              {importing ? 'Importation...' : 'Importer CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />
            </label>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              Exporter CSV
            </button>
          </div>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Catégorie</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Protéines</th>
                <th className="px-4 py-2">Lipides</th>
                <th className="px-4 py-2">Glucides</th>
                <th className="px-4 py-2">Fibres</th>
                <th className="px-4 py-2">Humidité</th>
                <th className="px-4 py-2">Cendres</th>
                <th className="px-4 py-2">Profil</th>
                <th className="px-4 py-2">Qualité</th>
                <th className="px-4 py-2">Solubilité</th>
                <th className="px-4 py-2">Ratio Min</th>
                <th className="px-4 py-2">Ratio Max</th>
                <th className="px-4 py-2">Prix/kg</th>
                <th className="px-4 py-2">Créé le</th>
                <th className="px-4 py-2">Mis à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {flours.map(flour => (
                <tr key={flour.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{flour.name}</td>
                  <td className="px-4 py-2">{flour.category}</td>
                  <td className="px-4 py-2">{flour.description || '-'}</td>
                  <td className="px-4 py-2">{flour.nutritional_values.proteins}%</td>
                  <td className="px-4 py-2">{flour.nutritional_values.lipids}%</td>
                  <td className="px-4 py-2">{flour.nutritional_values.carbs}%</td>
                  <td className="px-4 py-2">{flour.nutritional_values.fiber}%</td>
                  <td className="px-4 py-2">{flour.nutritional_values.moisture}%</td>
                  <td className="px-4 py-2">{flour.nutritional_values.ash}%</td>
                  <td className="px-4 py-2">{flour.protein_profile}</td>
                  <td className="px-4 py-2">{flour.protein_quality}</td>
                  <td className="px-4 py-2">{flour.solubility}</td>
                  <td className="px-4 py-2">{flour.recommended_ratio.min}%</td>
                  <td className="px-4 py-2">{flour.recommended_ratio.max}%</td>
                  <td className="px-4 py-2">{flour.price_per_kg ? `${flour.price_per_kg}€` : '-'}</td>
                  <td className="px-4 py-2">{flour.created_at ? new Date(flour.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{flour.updated_at ? new Date(flour.updated_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Total: {flours.length} farines
        </div>
      </div>
    </div>
  );
}

export default FlourListCSV;
