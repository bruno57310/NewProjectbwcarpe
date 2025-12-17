import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Flour } from '../types/flour';
import { X, Save, Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AntiNutrientContribution {
  id: string;
  flour_id: string;
  lectins: number;
  tannins: number;
  saponins: number;
  phytic_acid: number;
  trypsin_inhibitors: number;
  anti_nutrients_total_contri: number;
  contribution_anti_nutrientsyall?: {
    lectins: number;
    tannins: number;
    saponins: number;
    phytic_acid: number;
    trypsin_inhibitors: number;
  };
}

interface EnzymeContribution {
  id: string;
  flour_id: string;
  amylases: number;
  proteases: number;
  lipases: number;
  phytases: number;
  enzymes_total_contri: number;
  contribution_enzymesyall?: {
    amylases: number;
    proteases: number;
    lipases: number;
    phytases: number;
  };
}

interface EditFlourDetailsProps {
  flour: Flour;
  onClose: () => void;
  onUpdate: (updatedFlour: Flour) => void;
  antiNutrientContributions?: AntiNutrientContribution;
  enzymeContributions?: EnzymeContribution;
}

function EditFlourDetails({ flour, onClose, onUpdate, antiNutrientContributions, enzymeContributions }: EditFlourDetailsProps) {
  const [formData, setFormData] = useState<Flour>({
    ...flour,
    anti_nutrients_total: flour.anti_nutrients_total || (antiNutrientContributions?.anti_nutrients_total_contri || 0),
    enzymes_total: flour.enzymes_total || (enzymeContributions?.enzymes_total_contri || 0)
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newTip, setNewTip] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validate protein composition sum equals 100
      const proteinSum = Object.values(formData.protein_composition).reduce((sum, val) => sum + val, 0);
      if (Math.abs(proteinSum - 100) > 0.01) {
        throw new Error(`${t('catalog.proteinComposition')} ${t('calculator.mustBe100')}`);
      }

      const { error: updateError } = await supabase
        .from('flours_template')
        .update({
          nutritional_values: formData.nutritional_values,
          protein_composition: formData.protein_composition,
          enzymatic_composition: formData.enzymatic_composition,
          anti_nutrients: formData.anti_nutrients,
          mechanical_properties: formData.mechanical_properties,
          protein_profile: formData.protein_profile,
          protein_quality: formData.protein_quality,
          solubility: formData.solubility,
          recommended_ratio: formData.recommended_ratio,
          tips: formData.tips,
          anti_nutrients_total: formData.anti_nutrients_total,
          enzymes_total: formData.enzymes_total,
        })
        .eq('id', flour.id);

      if (updateError) {
        console.error('Supabase error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw new Error(`${updateError.message}${updateError.details ? ` (${updateError.details})` : ''}`);
      }
      
      onUpdate(formData);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`${t('common.error')}: ${errorMessage}`);
      console.error('Error updating flour:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateNutritionalValue = (key: keyof typeof formData.nutritional_values, value: string) => {
    // Convert to number but allow decimal values
    const numValue = parseFloat(value);
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        nutritional_values: {
          ...prev.nutritional_values,
          [key]: Math.max(0, Math.min(100, numValue))
        }
      }));
    }
  };

  const updateProteinComposition = (key: keyof typeof formData.protein_composition, value: string) => {
    // Convert to number but allow decimal values
    const numValue = parseFloat(value);
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        protein_composition: {
          ...prev.protein_composition,
          [key]: Math.max(0, Math.min(100, numValue))
        }
      }));
    }
  };

  const updateEnzymaticComposition = (key: keyof typeof formData.enzymatic_composition, value: string) => {
    // Convert to number but allow decimal values
    const numValue = parseFloat(value);
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        enzymatic_composition: {
          ...prev.enzymatic_composition,
          [key]: Math.max(0, Math.min(100, numValue))
        }
      }));
    }
  };

  const updateTotalValue = (field: 'anti_nutrients_total' | 'enzymes_total', value: string) => {
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const updateAntiNutrients = (key: keyof typeof formData.anti_nutrients, value: string) => {
    // Convert to number
    const numValue = parseFloat(value);
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        anti_nutrients: {
          ...prev.anti_nutrients,
          [key]: numValue
        }
      }));
    }
  };

  const updateMechanicalProperties = (key: keyof typeof formData.mechanical_properties, value: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({
      ...prev,
      mechanical_properties: {
        ...prev.mechanical_properties,
        [key]: value
      }
    }));
  };

  const updateRecommendedRatio = (key: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        recommended_ratio: {
          ...prev.recommended_ratio,
          [key]: Math.max(0, Math.min(100, numValue))
        }
      }));
    }
  };

  const addTip = () => {
    if (newTip.trim()) {
      setFormData(prev => ({
        ...prev,
        tips: [...(prev.tips || []), newTip.trim()]
      }));
      setNewTip('');
    }
  };

  const removeTip = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index)
    }));
  };

  // Calculate protein composition sum
  const proteinCompositionSum = Object.values(formData.protein_composition).reduce((sum, val) => sum + val, 0);
  const isProteinSumValid = Math.abs(proteinCompositionSum - 100) < 0.01;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-green-800">
              {t('common.edit')} {flour.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!isProteinSumValid && (
            <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
              {t('catalog.proteinComposition')}: {proteinCompositionSum.toFixed(2)}% ({t('calculator.mustBe100')})
            </div>
          )}

          <div className="space-y-8">
            {/* Properties */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                {t('catalog.properties')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('catalog.proteinProfile')}
                  </label>
                  <select
                    value={formData.protein_profile}
                    onChange={(e) => setFormData({
                      ...formData,
                      protein_profile: e.target.value as 'simple' | 'complex'
                    })}
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
                    onChange={(e) => setFormData({
                      ...formData,
                      protein_quality: e.target.value as 'complete' | 'incomplete'
                    })}
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
                    onChange={(e) => setFormData({
                      ...formData,
                      solubility: e.target.value as 'low' | 'medium' | 'high'
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">{t('flour.properties.low')}</option>
                    <option value="medium">{t('flour.properties.medium')}</option>
                    <option value="high">{t('flour.properties.high')}</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Composition Protéique */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                {t('catalog.proteinComposition')} 
                <span className={`ml-2 text-sm ${isProteinSumValid ? 'text-green-600' : 'text-red-600'}`}>
                  ({proteinCompositionSum.toFixed(2)}%)
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData.protein_composition).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {key} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={value}
                      onChange={(e) => updateProteinComposition(key as keyof typeof formData.protein_composition, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Valeurs Nutritionnelles */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                {t('catalog.nutritionalValues')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData.nutritional_values).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {t(`catalog.${key}`)} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={value}
                      onChange={(e) => updateNutritionalValue(key as keyof typeof formData.nutritional_values, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Composition Enzymatique */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                {t('catalog.enzymaticComposition')}
              </h3>
              <div className="space-y-3">
                {enzymeContributions ? (
                  <>
                    {Object.entries(enzymeContributions.contribution_enzymesyall || {}).map(([enzyme, value]) => (
                      <div key={enzyme}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {enzyme}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.001"
                          value={typeof value === 'number' ? value : 0}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          readOnly
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        Total Enzymes
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.enzymes_total || enzymeContributions.enzymes_total_contri || 0}
                        onChange={(e) => updateTotalValue('enzymes_total', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </>
                ) : (
                  Object.entries(formData.enzymatic_composition).map(([enzyme, percentage]) => (
                    <div key={enzyme}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {enzyme} (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={percentage}
                        onChange={(e) => updateEnzymaticComposition(enzyme as keyof typeof formData.enzymatic_composition, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Anti-nutriments */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.antiNutrients')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {antiNutrientContributions ? (
                  <>
                    {['lectins', 'tannins', 'saponins', 'phytic_acid', 'trypsin_inhibitors'].map((key) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key.replace('_', ' ')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={antiNutrientContributions[key as keyof typeof antiNutrientContributions] || 0}
                          onChange={(e) => updateAntiNutrients(
                            key as keyof typeof formData.anti_nutrients,
                            e.target.value
                          )}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          readOnly
                        />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        Total Anti-nutrients
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.anti_nutrients_total || antiNutrientContributions.anti_nutrients_total_contri || 0}
                        onChange={(e) => updateTotalValue('anti_nutrients_total', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </>
                ) : (
                  Object.entries(formData.anti_nutrients).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key.replace('_', ' ')}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          anti_nutrients: {
                            ...formData.anti_nutrients,
                            [key]: e.target.value as 'low' | 'medium' | 'high'
                          }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="low">{t('flour.properties.low')}</option>
                        <option value="medium">{t('flour.properties.medium')}</option>
                        <option value="high">{t('flour.properties.high')}</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Propriétés Mécaniques */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">{t('catalog.mechanicalProperties')}</h3>
              <div className="space-y-3">
                {Object.entries(formData.mechanical_properties).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {t(`catalog.${key}`)}
                    </label>
                    <select
                      value={value}
                      onChange={(e) => updateMechanicalProperties(
                        key as keyof typeof formData.mechanical_properties,
                        e.target.value as 'low' | 'medium' | 'high'
                      )}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="low">{t('flour.properties.low')}</option>
                      <option value="medium">{t('flour.properties.medium')}</option>
                      <option value="high">{t('flour.properties.high')}</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended Ratio */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                {t('catalog.recommendedRatio')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.recommended_ratio.min}
                    onChange={(e) => updateRecommendedRatio('min', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.recommended_ratio.max}
                    onChange={(e) => updateRecommendedRatio('max', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </section>

            {/* Usage Tips */}
            <section>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                {t('catalog.tips')}
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    placeholder="Add a new tip..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={addTip}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.tips && formData.tips.map((tip, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="flex-1">{tip}</span>
                      <button
                        type="button"
                        onClick={() => removeTip(index)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!formData.tips || formData.tips.length === 0) && (
                    <p className="text-gray-500 italic">No tips added yet. Add some tips to help users.</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !isProteinSumValid}
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('common.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditFlourDetails;
