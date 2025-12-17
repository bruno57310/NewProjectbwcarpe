import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Move, Maximize, Minimize, Save, X, ArrowUp, ArrowDown, Edit2, Globe, RefreshCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import TranslationEditor from './TranslationEditor';

interface TextWindowProps {
  page: string;
}

interface TextWindow {
  id: string;
  title: string;
  content: string | null;
  position: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
  background_color: string;
  text_color: string;
  title_background_color: string;
  title_text_color: string;
  border_style: {
    width: string;
    style: string;
    color: string;
    radius: string;
  };
  active: boolean;
  page: string;
}

function TextWindow({ page }: TextWindowProps) {
  const [textWindows, setTextWindows] = useState<TextWindow[]>([]);
  const [editingWindow, setEditingWindow] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTranslation, setEditingTranslation] = useState<boolean>(false);
  const [translationKey, setTranslationKey] = useState<string | null>(null);
  const [translationValue, setTranslationValue] = useState<string | null>(null);
  const [showTranslationEditor, setShowTranslationEditor] = useState<boolean>(false);
  const [selectedTranslationKey, setSelectedTranslationKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;
  const [positions, setPositions] = useState<Record<string, {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
    isDragging: boolean;
    startX: number;
    startY: number;
  }>>({});
  const { user } = useAuth();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';
  const windowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { t, i18n } = useTranslation();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchTextWindows = async (retryAttempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching text windows for page:', page);
      
      const { data, error: supabaseError } = await supabase
        .from('text_windows')
        .select('*')
        .eq('page', page)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      
      if (data) {
        console.log('Found text windows:', data.length);
        setTextWindows(data);
        
        // Initialize positions state
        const initialPositions: Record<string, any> = {};
        data.forEach(window => {
          initialPositions[window.id] = {
            ...window.position,
            isDragging: false,
            startX: 0,
            startY: 0
          };
        });
        setPositions(initialPositions);
        setError(null);
      } else {
        console.log('No text windows found for page:', page);
      }
    } catch (err) {
      console.error('Error fetching text windows:', err);
      
      // Implement exponential backoff for retries
      if (retryAttempt < maxRetries) {
        const backoffTime = Math.min(1000 * Math.pow(2, retryAttempt), 8000);
        console.log(`Retrying in ${backoffTime}ms...`);
        await sleep(backoffTime);
        setRetryCount(retryAttempt + 1);
        return fetchTextWindows(retryAttempt + 1);
      } else {
        setError('Unable to load content. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTextWindows();

    // Real-time subscription disabled temporarily
    // TODO: Re-enable when Realtime is configured on the new Supabase instance
  }, [page]);

  const handleRetry = () => {
    setRetryCount(0);
    fetchTextWindows();
  };

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (!isAdmin || editingWindow !== id || editingContent !== null || editingTranslation) return;
    
    setPositions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isDragging: true,
        startX: e.clientX - prev[id].x,
        startY: e.clientY - prev[id].y
      }
    }));
  };

  const handleDragEnd = (id: string) => {
    setPositions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isDragging: false
      }
    }));
  };

  const handleDrag = (e: React.MouseEvent, id: string) => {
    if (!positions[id]?.isDragging || !isAdmin || editingWindow !== id || editingContent !== null || editingTranslation) return;
    
    setPositions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        x: e.clientX - prev[id].startX,
        y: e.clientY - prev[id].startY
      }
    }));
  };

  const handleResize = (id: string, dimension: 'width' | 'height', change: number) => {
    if (!isAdmin || editingWindow !== id || editingContent !== null || editingTranslation) return;
    
    setPositions(prev => {
      const currentValue = prev[id][dimension];
      // If the current value is a percentage
      if (typeof currentValue === 'string' && currentValue.endsWith('%')) {
        const percentValue = parseInt(currentValue, 10);
        const newValue = Math.max(10, Math.min(100, percentValue + change));
        return {
          ...prev,
          [id]: {
            ...prev[id],
            [dimension]: `${newValue}%`
          }
        };
      } 
      // If the current value is in pixels
      else if (typeof currentValue === 'string' && currentValue.endsWith('px')) {
        const pixelValue = parseInt(currentValue, 10);
        const newValue = Math.max(100, pixelValue + change);
        return {
          ...prev,
          [id]: {
            ...prev[id],
            [dimension]: `${newValue}px`
          }
        };
      }
      // If the current value is 'auto'
      else if (currentValue === 'auto') {
        // Convert auto to pixels for height, starting with a reasonable value
        if (dimension === 'height') {
          return {
            ...prev,
            [id]: {
              ...prev[id],
              [dimension]: change > 0 ? '200px' : '150px'
            }
          };
        }
        // For width, convert to percentage
        return {
          ...prev,
          [id]: {
            ...prev[id],
            [dimension]: change > 0 ? '50%' : '30%'
          }
        };
      }
      // Default case
      return {
        ...prev,
        [id]: {
          ...prev[id],
          [dimension]: change > 0 ? '50%' : '30%'
        }
      };
    });
  };

  const handleZIndexChange = (id: string, change: number) => {
    if (!isAdmin || editingWindow !== id || editingContent !== null || editingTranslation) return;
    
    setPositions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        zIndex: Math.max(0, prev[id].zIndex + change)
      }
    }));
  };

  const savePosition = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      const { error: saveError } = await supabase
        .from('text_windows')
        .update({
          position: {
            x: positions[id].x,
            y: positions[id].y,
            width: positions[id].width,
            height: positions[id].height,
            zIndex: positions[id].zIndex
          }
        })
        .eq('id', id);
      
      if (saveError) throw saveError;
      setEditingWindow(null);
      setEditingTitle(null);
      setEditingContent(null);
      setEditingTranslation(false);
      setTranslationKey(null);
      setTranslationValue(null);
    } catch (err) {
      console.error('Error saving text window position:', err);
      setError('Failed to save changes. Please try again.');
    }
  };

  const startEditingContent = (window: TextWindow) => {
    setEditingTitle(window.title);
    setEditingContent(window.content || '');
  };

  const saveContent = async (id: string) => {
    if (!isAdmin || editingTitle === null || editingContent === null) return;
    
    try {
      const { error: saveError } = await supabase
        .from('text_windows')
        .update({
          title: editingTitle,
          content: editingContent
        })
        .eq('id', id);
      
      if (saveError) throw saveError;
      setEditingTitle(null);
      setEditingContent(null);
      setEditingWindow(null);
      setEditingTranslation(false);
      setTranslationKey(null);
      setTranslationValue(null);
    } catch (err) {
      console.error('Error saving text window content:', err);
      setError('Failed to save changes. Please try again.');
    }
  };

  const startEditingTranslation = (window: TextWindow) => {
    // Extract the first translation key from title or content
    const titleMatch = window.title.match(/\{\{([^}]+)\}\}/);
    const contentMatch = window.content ? window.content.match(/\{\{([^}]+)\}\}/) : null;
    
    const key = titleMatch ? titleMatch[1].trim() : contentMatch ? contentMatch[1].trim() : null;
    
    if (key) {
      setSelectedTranslationKey(key);
      setShowTranslationEditor(true);
    } else {
      alert('No translation key found in this window. Please add a key in the format {{key}} first.');
    }
  };

  // Function to translate content using i18next
  const translateContent = (content: string | null): string => {
    if (!content) return '';
    
    // Look for translation keys in the format {{key}}
    return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      // Trim the key to remove any whitespace
      const trimmedKey = key.trim();
      
      // Try to get the translation for the key
      const translatedValue = t(trimmedKey);
      
      // If the translation is the same as the key, it means no translation was found
      if (translatedValue === trimmedKey) {
        console.warn(`Translation key not found: ${trimmedKey}`);
        return match; // Return the original {{key}} format
      }
      
      // Return the translated value
      return translatedValue;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4 bg-red-50 rounded-lg">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (textWindows.length === 0) return null;

  return (
    <>
      {textWindows.map(window => (
        <div 
          key={window.id}
          ref={el => windowRefs.current[window.id] = el}
          className={`absolute ${editingWindow === window.id && editingContent === null && !editingTranslation ? 'cursor-move' : ''}`}
          style={{
            transform: `translate(${positions[window.id]?.x || window.position.x}px, ${positions[window.id]?.y || window.position.y}px)`,
            width: positions[window.id]?.width || window.position.width,
            height: positions[window.id]?.height || window.position.height,
            zIndex: positions[window.id]?.zIndex || window.position.zIndex,
            backgroundColor: window.background_color,
            color: window.text_color,
            borderWidth: window.border_style.width,
            borderStyle: window.border_style.style,
            borderColor: window.border_style.color,
            borderRadius: window.border_style.radius,
            transition: editingWindow === window.id && editingContent === null && !editingTranslation ? 'none' : 'transform 0.3s ease',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
          onMouseDown={e => handleDragStart(e, window.id)}
          onMouseUp={() => handleDragEnd(window.id)}
          onMouseLeave={() => handleDragEnd(window.id)}
          onMouseMove={e => handleDrag(e, window.id)}
        >
          <div 
            className="p-2"
            style={{
              backgroundColor: window.title_background_color || window.background_color,
              color: window.title_text_color || window.text_color,
              borderTopLeftRadius: window.border_style.radius,
              borderTopRightRadius: window.border_style.radius
            }}
          >
            {editingTitle !== null && editingContent !== null && window.id === editingWindow ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-green-500 text-lg font-semibold"
              />
            ) : editingTranslation && window.id === editingWindow ? (
              <div className="text-lg font-semibold">
                {window.title}
              </div>
            ) : (
              <h3 className="text-lg font-semibold">{translateContent(window.title)}</h3>
            )}
          </div>
          
          <div className="p-4">
            {editingTitle !== null && editingContent !== null && window.id === editingWindow ? (
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-full min-h-[100px] bg-transparent border border-gray-300 rounded p-2 focus:outline-none focus:border-green-500"
              />
            ) : editingTranslation && window.id === editingWindow ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Translation Key:</label>
                  <input
                    type="text"
                    value={translationKey || ''}
                    onChange={(e) => setTranslationKey(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Translation Value:</label>
                  <textarea
                    value={translationValue || ''}
                    onChange={(e) => setTranslationValue(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded min-h-[100px]"
                  />
                </div>
              </div>
            ) : (
              <div 
                className="prose max-w-none whitespace-pre-wrap" 
                dangerouslySetInnerHTML={{ __html: translateContent(window.content || '') }}
              />
            )}
          </div>

          {isAdmin && (
            <div className="absolute top-2 right-2 flex flex-wrap gap-2 max-w-[200px]">
              {editingWindow === window.id && editingContent === null && !editingTranslation ? (
                <>
                  <button 
                    onClick={() => savePosition(window.id)}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    title="Sauvegarder la position"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setEditingWindow(null)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleResize(window.id, 'width', 50)}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    title="Augmenter la largeur"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleResize(window.id, 'width', -50)}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    title="Diminuer la largeur"
                  >
                    <Minimize className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleResize(window.id, 'height', 50)}
                    className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                    title="Augmenter la hauteur"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleResize(window.id, 'height', -50)}
                    className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                    title="Diminuer la hauteur"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleZIndexChange(window.id, 1)}
                    className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700"
                    title="Augmenter le z-index"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleZIndexChange(window.id, -1)}
                    className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700"
                    title="Diminuer le z-index"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </>
              ) : editingTitle !== null && editingContent !== null && window.id === editingWindow ? (
                <>
                  <button 
                    onClick={() => saveContent(window.id)}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    title="Sauvegarder le contenu"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingTitle(null);
                      setEditingContent(null);
                      setEditingWindow(null);
                    }}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setEditingWindow(window.id);
                      setEditingTitle(null);
                      setEditingContent(null);
                      setEditingTranslation(false);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                    title="Modifier la position"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingWindow(window.id);
                      startEditingContent(window);
                      setEditingTranslation(false);
                    }}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    title="Modifier le contenu"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      startEditingTranslation(window);
                    }}
                    className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                    title="Modifier la traduction"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Size indicator */}
          {editingWindow === window.id && editingContent === null && !editingTranslation && (
            <div className="absolute bottom-0 right-0 bg-black text-white text-xs px-1 py-0.5 rounded-tl">
              {positions[window.id]?.width || window.position.width} × {positions[window.id]?.height || window.position.height} (z: {positions[window.id]?.zIndex || window.position.zIndex})
            </div>
          )}
        </div>
      ))}

      {showTranslationEditor && (
        <TranslationEditor 
          onClose={() => setShowTranslationEditor(false)} 
          initialKey={selectedTranslationKey}
        />
      )}
    </>
  );
}

export default TextWindow;
