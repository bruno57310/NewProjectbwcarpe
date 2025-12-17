import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Move, Maximize, Minimize, Save, X, ArrowUp, ArrowDown, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface ClickableImageWindowProps {
  page: string;
}

interface ImageWindow {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
  active: boolean;
  page: string;
}

function ClickableImageWindow({ page }: ClickableImageWindowProps) {
  const [imageWindows, setImageWindows] = useState<ImageWindow[]>([]);
  const [editingWindow, setEditingWindow] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchImageWindows = async () => {
      try {
        const { data } = await supabase
          .from('clickable_image_windows')
          .select('*')
          .eq('page', page)
          .eq('active', true)
          .order('created_at', { ascending: false });
        
        if (data) {
          setImageWindows(data);
          
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
        }
      } catch (error) {
        console.error('Error fetching image windows:', error);
      }
    };

    fetchImageWindows();

    // Real-time subscription disabled temporarily
    // TODO: Re-enable when Realtime is configured on the new Supabase instance
  }, [page]);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (!isAdmin || editingWindow !== id) return;
    
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
    if (!positions[id]?.isDragging || !isAdmin || editingWindow !== id) return;
    
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
    if (!isAdmin || editingWindow !== id) return;
    
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
              [dimension]: change > 0 ? '300px' : '200px'
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
    if (!isAdmin || editingWindow !== id) return;
    
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
      const { error } = await supabase
        .from('clickable_image_windows')
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
      
      if (error) throw error;
      setEditingWindow(null);
    } catch (err) {
      console.error('Error saving image window position:', err);
    }
  };

  if (imageWindows.length === 0) return null;

  return (
    <>
      {imageWindows.map(window => (
        <div 
          key={window.id}
          ref={el => windowRefs.current[window.id] = el}
          className={`absolute ${editingWindow === window.id ? 'cursor-move' : 'cursor-pointer'}`}
          style={{
            transform: `translate(${positions[window.id]?.x || window.position.x}px, ${positions[window.id]?.y || window.position.y}px)`,
            width: positions[window.id]?.width || window.position.width,
            height: positions[window.id]?.height || window.position.height,
            zIndex: positions[window.id]?.zIndex || window.position.zIndex,
            transition: editingWindow === window.id ? 'none' : 'transform 0.3s ease',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
          onMouseDown={e => handleDragStart(e, window.id)}
          onMouseUp={() => handleDragEnd(window.id)}
          onMouseLeave={() => handleDragEnd(window.id)}
          onMouseMove={e => handleDrag(e, window.id)}
        >
          {/* Use Link component for internal links, and regular anchor for external links */}
          {window.link_url.startsWith('/') ? (
            <Link 
              to={window.link_url}
              className="block w-full h-full"
              onClick={(e) => {
                if (editingWindow === window.id) {
                  e.preventDefault();
                }
              }}
            >
              <div className="relative w-full h-full">
                <img 
                  src={window.image_url} 
                  alt={window.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1564415900645-55a35c0c6b92?auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                  <h3 className="text-lg font-semibold">
                    {window.title}
                  </h3>
                </div>
              </div>
            </Link>
          ) : (
            <a 
              href={window.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full h-full"
              onClick={(e) => {
                if (editingWindow === window.id) {
                  e.preventDefault();
                }
              }}
            >
              <div className="relative w-full h-full">
                <img 
                  src={window.image_url} 
                  alt={window.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1564415900645-55a35c0c6b92?auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                  <h3 className="text-lg font-semibold flex items-center">
                    {window.title}
                    <LinkIcon className="ml-2 w-4 h-4" />
                  </h3>
                </div>
              </div>
            </a>
          )}

          {isAdmin && (
            <div className="absolute top-2 right-2 flex flex-wrap gap-2 max-w-[200px]">
              {editingWindow === window.id ? (
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
              ) : (
                <button 
                  onClick={() => setEditingWindow(window.id)}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  title="Modifier la position"
                >
                  <Move className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Size indicator */}
          {editingWindow === window.id && (
            <div className="absolute bottom-0 right-0 bg-black text-white text-xs px-1 py-0.5 rounded-tl">
              {positions[window.id]?.width || window.position.width} × {positions[window.id]?.height || window.position.height} (z: {positions[window.id]?.zIndex || window.position.zIndex})
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default ClickableImageWindow;
