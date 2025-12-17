import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, CheckCircle, AlertCircle, RefreshCw, Info, Tag } from 'lucide-react';
import { sendToN8n } from '../lib/n8nService';
import type { SavedMix } from '../types/mix';
import { useTranslation } from 'react-i18next';

interface MixCombinerN8nIntegrationProps {
  selectedMixes: string[];
  savedMixes: SavedMix[];
  mixWeights: Record<string, number>;
}

function MixCombinerN8nIntegration({ selectedMixes, savedMixes, mixWeights }: MixCombinerN8nIntegrationProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseDetails, setResponseDetails] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleSendToN8n = async () => {
    if (selectedMixes.length < 2 || selectedMixes.length > 4) {
      setError(t('calculator.mixCombiner.selectBetween2And4'));
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResponseDetails(null);

    try {
      // Send the selected mix IDs to N8N
      const result = await sendToN8n(selectedMixes, mixWeights);
      setResponseDetails(JSON.stringify(result, null, 2));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Get the names of selected mixes for display
  const getSelectedMixNames = () => {
    return selectedMixes.map(id => {
      const mix = savedMixes.find(m => m.id === id);
      return mix ? mix.name : id;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-full">
          <Send className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-blue-800">
          {t('calculator.mixCombiner.sendToN8n')}
        </h3>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">{t('calculator.mixCombiner.selectedMixes')} ({selectedMixes.length}/4)</h4>
        {selectedMixes.length > 0 ? (
          <div className="space-y-2">
            {getSelectedMixNames().map((name, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {name}
                </div>
                <span className="text-xs font-medium">
                  Weight: {(mixWeights[selectedMixes[index]] || 1).toFixed(1)}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            {t('calculator.mixCombiner.noMixesSelected')}
          </p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <Info className="w-5 h-5" />
          <h4 className="font-medium">{t('calculator.mixCombiner.aboutN8nIntegration')}</h4>
        </div>
        <p className="text-blue-700 text-sm">
          {t('calculator.mixCombiner.n8nDescription')}
        </p>
      </div>

      <button
        disabled={loading || selectedMixes.length < 2 || selectedMixes.length > 4}
        onClick={handleSendToN8n}
        className={`w-full px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : success
            ? "bg-green-600"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
        {success && <CheckCircle className="w-4 h-4" />}
        {!loading && !success && <Send className="w-4 h-4" />}
        {loading 
          ? t('common.loading') 
          : success 
            ? t('calculator.mixCombiner.sent') 
            : t('calculator.mixCombiner.sendToN8n')}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {responseDetails && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">{t('calculator.mixCombiner.response')}</h4>
          <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
            {responseDetails}
          </pre>
        </div>
      )}
    </div>
  );
}

export default MixCombinerN8nIntegration;
