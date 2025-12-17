import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, X, RefreshCw, Search, Check, AlertCircle, Globe, WifiOff, FileText, Shield, Info, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TranslationEditorProps {
  onClose: () => void;
  initialKey?: string;
}

function TranslationEditor({ onClose, initialKey = '' }: TranslationEditorProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [key, setKey] = useState(initialKey);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [retryCount, setRetryCount] = useState(0);
  const [savingMethod, setSavingMethod] = useState<'api' | 'memory'>('memory');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showHiddenChars, setShowHiddenChars] = useState(false);
  const MAX_RETRIES = 3;
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ];

  useEffect(() => {
    if (key) {
      loadTranslations(key);
    }
    loadAvailableKeys();
  }, [key]);

  const loadAvailableKeys = () => {
    try {
      const resources = i18n.getDataByLanguage(i18n.language);
      if (!resources || !resources.translation) {
        setAvailableKeys([]);
        return;
      }

      const extractKeys = (obj: any, prefix = ''): string[] => {
        let keys: string[] = [];
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = [...keys, ...extractKeys(obj[key], fullKey)];
          } else {
            keys.push(fullKey);
          }
        }
        return keys;
      };

      const allKeys = extractKeys(resources.translation);
      setAvailableKeys(allKeys);
    } catch (err) {
      console.error('Error loading available keys:', err);
      setAvailableKeys([]);
    }
  };

  const loadTranslations = (translationKey: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const translationValues: Record<string, string> = {};
      
      languages.forEach(lang => {
        const resources = i18n.getDataByLanguage(lang.code);
        if (resources && resources.translation) {
          const keyParts = translationKey.split('.');
          let value = resources.translation;
          
          for (const part of keyParts) {
            if (value && typeof value === 'object' && part in value) {
              value = value[part];
            } else {
              value = null;
              break;
            }
          }
          
          translationValues[lang.code] = value !== null ? String(value) : '';
        } else {
          translationValues[lang.code] = '';
        }
      });
      
      setTranslations(translationValues);
    } catch (err) {
      console.error('Error loading translations:', err);
      setError('Error loading translations');
    } finally {
      setLoading(false);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const saveTranslationViaAPI = async () => {
    if (!navigator.onLine) {
      setError('You are offline. Please check your internet connection and try again.');
      return;
    }

    if (!isAdmin) {
      setError('Only administrators can save translations permanently. Please use in-memory saving instead.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated. Please log in to save translations.');
      }

      if (!key || !translations[selectedLanguage]) {
        throw new Error('Translation key and value are required.');
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-translation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          key,
          value: translations[selectedLanguage],
          language: selectedLanguage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      setSuccess(`Translation key "${key}" updated successfully for ${languages.find(l => l.code === selectedLanguage)?.name}`);
      setRetryCount(0);
      
      // Update the translation in i18next as well
      updateTranslationInMemory();
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving translation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error saving translation';
      setError(errorMessage);

      // Implement retry logic for network errors
      if (err instanceof Error && err.message.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await delay(retryDelay);
        return saveTranslationViaAPI();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTranslationInMemory = () => {
    if (!key || !translations[selectedLanguage]) {
      return false;
    }

    try {
      // Split the key into parts to handle nested objects
      const keyParts = key.split('.');
      const lastPart = keyParts.pop();
      
      if (!lastPart) return false;
      
      // Create a nested object structure based on the key
      const nestedObj: any = {};
      let currentObj = nestedObj;
      
      keyParts.forEach((part, index) => {
        currentObj[part] = {};
        currentObj = currentObj[part];
      });
      
      // Set the value at the deepest level
      currentObj[lastPart] = translations[selectedLanguage];
      
      // Add the resource to i18next
      i18n.addResourceBundle(
        selectedLanguage,
        'translation',
        nestedObj,
        true,
        true
      );
      
      return true;
    } catch (err) {
      console.error('Error updating translation in memory:', err);
      return false;
    }
  };

  const saveTranslationInMemory = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!key || !translations[selectedLanguage]) {
        throw new Error('Translation key and value are required.');
      }

      const success = updateTranslationInMemory();
      
      if (!success) {
        throw new Error('Failed to update translation in memory.');
      }

      setSuccess(`Translation key "${key}" updated in memory for ${languages.find(l => l.code === selectedLanguage)?.name}`);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving translation in memory:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error saving translation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveTranslation = async () => {
    if (savingMethod === 'api') {
      await saveTranslationViaAPI();
    } else {
      await saveTranslationInMemory();
    }
  };

  const handleSearch = () => {
    if (!searchTerm) return;
    
    const matchingKeys = availableKeys.filter(k => 
      k.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matchingKeys.length > 0) {
      setKey(matchingKeys[0]);
    } else {
      setError(`No keys found matching "${searchTerm}"`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setError('Failed to copy to clipboard');
      });
  };

  // Function to convert text to show hidden characters
  const formatWithHiddenChars = (text: string): string => {
    if (!showHiddenChars) return text;
    
    return text
      .replace(/\t/g, '→   ')  // Tab
      .replace(/ /g, '·')      // Space
      .replace(/\n/g, '↵\n')   // Line feed
      .replace(/\r/g, '⏎\r');  // Carriage return
  };

  // Function to display text with hidden characters
  const displayWithHiddenChars = (text: string): React.ReactNode => {
    if (!showHiddenChars) return text;
    
    // Split by newlines to preserve them in the output
    const lines = text.split('\n');
    
    return lines.map((line, i) => (
      <React.Fragment key={i}>
        {line.replace(/\t/g, '→   ').replace(/ /g, '·').replace(/\r/g, '⏎')}
        {i < lines.length - 1 && (
          <>
            <span className="text-blue-400">↵</span>
            <br />
          </>
        )}
      </React.Fragment>
    ));
  };

  const filteredKeys = searchTerm 
    ? availableKeys.filter(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
    : availableKeys;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-purple-800">
                Translation Editor
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!navigator.onLine && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2">
              <WifiOff className="w-5 h-5" />
              You are currently offline. Changes will only be saved in memory until you reconnect.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Translation Keys
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    placeholder="Search for keys..."
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredKeys.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Keys
                </label>
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  size={5}
                >
                  {filteredKeys.map(k => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Translation Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="textWindow.exampleTitle"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Translation Value ({languages.find(l => l.code === selectedLanguage)?.name})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHiddenChars(!showHiddenChars)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      showHiddenChars 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Toggle hidden characters"
                  >
                    {showHiddenChars ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showHiddenChars ? 'Hide' : 'Show'} hidden chars
                  </button>
                  <div className="flex items-center text-xs text-blue-600">
                    <Info className="w-3 h-3 mr-1" />
                    <span>Preserves whitespace, tabs, and line breaks</span>
                  </div>
                </div>
              </div>
              <textarea
                value={translations[selectedLanguage] || ''}
                onChange={(e) => setTranslations({
                  ...translations,
                  [selectedLanguage]: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-lg font-mono whitespace-pre-wrap h-60"
                placeholder="Enter translation value..."
                style={{ 
                  tabSize: 4,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-blue-800">Current Translations</h3>
                {copySuccess && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {copySuccess}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {languages.map(lang => (
                  <div key={lang.code} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-blue-700">{lang.name}:</span>
                      <button 
                        onClick={() => copyToClipboard(translations[lang.code] || '')}
                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 bg-white rounded border border-blue-200 overflow-x-auto text-sm whitespace-pre-wrap break-words">
                      {translations[lang.code] 
                        ? displayWithHiddenChars(translations[lang.code]) 
                        : '(No translation)'}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Saving Method
              </h3>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="savingMethod"
                    value="memory"
                    checked={savingMethod === 'memory'}
                    onChange={() => setSavingMethod('memory')}
                    className="text-blue-600"
                  />
                  <span>In-memory only (temporary)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="savingMethod"
                    value="api"
                    checked={savingMethod === 'api'}
                    onChange={() => setSavingMethod('api')}
                    className="text-blue-600"
                    disabled={!navigator.onLine || !isAdmin}
                  />
                  <span className="flex items-center gap-1">
                    API (permanent)
                    {!isAdmin && <Shield className="w-4 h-4 text-red-500" title="Admin only" />}
                  </span>
                </label>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                {isAdmin 
                  ? "The 'API' option attempts to save translations permanently through the Edge Function, but requires a working network connection."
                  : "The 'API' option requires admin privileges. You can only use in-memory saving."}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={saveTranslation}
              disabled={loading || !key || (savingMethod === 'api' && (!navigator.onLine || !isAdmin))}
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Translation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TranslationEditor;
