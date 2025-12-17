import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Move, Maximize, Minimize, Save, X, ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface BannerProps {
  placement: string;
  index?: number; // Add index prop to differentiate multiple banners in the same placement
}

interface BannerData {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  position?: {
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
  };
}

function Banner({ placement, index = 0 }: BannerProps) {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState<{
    x: number;
    y: number;
    width: string;
    height: string;
    zIndex: number;
    isDragging: boolean;
    startX: number;
    startY: number;
  }>({
    x: 0,
    y: 0,
    width: '100%',
    height: 'auto',
    zIndex: 10,
    isDragging: false,
    startX: 0,
    startY: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;
  const { user } = useAuth();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';
  const { t } = useTranslation();
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchBanner = async (retryAttempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching banner for placement:', placement);
      
      const now = new Date().toISOString();
      const { data, error: supabaseError } = await supabase
        .from('banners')
        .select('*')
        .eq('placement', placement)
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (supabaseError) {
        console.error('Supabase error fetching banner:', supabaseError);
        throw supabaseError;
      }
      
      if (data && data.length > 0) {
        // If index is provided, try to get that specific banner
        const selectedBanner = index < data.length ? data[index] : data[0];
        console.log(`Banner found for placement ${placement} at index ${index}:`, selectedBanner);
        setBanner(selectedBanner);
        
        // Initialize position from banner data if available
        if (selectedBanner.position) {
          setPosition(prev => ({
            ...prev,
            x: selectedBanner.position.x || 0,
            y: selectedBanner.position.y || 0,
            width: selectedBanner.position.width || '100%',
            height: selectedBanner.position.height || 'auto',
            zIndex: selectedBanner.position.zIndex || 10
          }));
        }
      } else {
        console.log(`No banner found for placement ${placement} at index ${index}`);
        setBanner(null);
      }
    } catch (err) {
      console.error('Error fetching banner for placement', placement, ':', err);
      
      // Implement exponential backoff for retries
      if (retryAttempt < maxRetries) {
        const backoffTime = Math.min(1000 * Math.pow(2, retryAttempt), 8000);
        console.log(`Retrying in ${backoffTime}ms...`);
        await sleep(backoffTime);
        setRetryCount(retryAttempt + 1);
        return fetchBanner(retryAttempt + 1);
      } else {
        setError(`Unable to load banner for ${placement}. Please check your connection and try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();

    // Real-time subscription disabled temporarily
    // TODO: Re-enable when Realtime is configured on the new Supabase instance
  }, [placement, index]);

  const handleRetry = () => {
    setRetryCount(0);
    fetchBanner();
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (!isAdmin || !isEditing) return;
    
    setPosition(prev => ({
      ...prev,
      isDragging: true,
      startX: e.clientX - prev.x,
      startY: e.clientY - prev.y
    }));
  };

  const handleDragEnd = () => {
    setPosition(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!position.isDragging || !isAdmin || !isEditing) return;
    
    setPosition(prev => ({
      ...prev,
      x: e.clientX - prev.startX,
      y: e.clientY - prev.startY
    }));
  };

  const handleResize = (dimension: 'width' | 'height', change: number) => {
    if (!isAdmin || !isEditing) return;
    
    setPosition(prev => {
      const currentValue = prev[dimension];
      // If the current value is a percentage
      if (typeof currentValue === 'string' && currentValue.endsWith('%')) {
        const percentValue = parseInt(currentValue, 10);
        const newValue = Math.max(10, Math.min(100, percentValue + change));
        return {
          ...prev,
          [dimension]: `${newValue}%`
        };
      } 
      // If the current value is in pixels
      else if (typeof currentValue === 'string' && currentValue.endsWith('px')) {
        const pixelValue = parseInt(currentValue, 10);
        const newValue = Math.max(100, pixelValue + change);
        return {
          ...prev,
          [dimension]: `${newValue}px`
        };
      }
      // If the current value is 'auto'
      else if (currentValue === 'auto') {
        // Convert auto to pixels for height, starting with a reasonable value
        if (dimension === 'height') {
          return {
            ...prev,
            [dimension]: change > 0 ? '200px' : '150px'
          };
        }
        // For width, convert to percentage
        return {
          ...prev,
          [dimension]: change > 0 ? '50%' : '30%'
        };
      }
      // Default case
      return {
        ...prev,
        [dimension]: change > 0 ? '50%' : '30%'
      };
    });
  };

  const handleZIndexChange = (id: string, change: number) => {
    if (!isAdmin || !isEditing) return;
    
    setPosition(prev => ({
      ...prev,
      zIndex: Math.max(0, (prev.zIndex || 10) + change)
    }));
  };

  const savePosition = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('banners')
        .update({
          position: {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            zIndex: position.zIndex || 10
          }
        })
        .eq('id', id);
      
      if (error) throw error;
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving banner position:', err);
    }
  };

  // Translate content using i18next
  const translateContent = (content: string | null): string => {
    if (!content) return '';
    
    // Look for translation keys in the format {{key}}
    return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const translated = t(key.trim());
      // If no translation found, return the original key
      return translated === key.trim() ? match : translated;
    });
  };

  // Determine if we should use a responsive layout based on dimensions
  const isNarrow = position.width === 'auto' || 
                  (position.width.endsWith('px') && parseInt(position.width, 10) < 500) ||
                  (position.width.endsWith('%') && parseInt(position.width, 10) < 50);

  const isShort = position.height !== 'auto' && 
                 ((position.height.endsWith('px') && parseInt(position.height, 10) < 150) ||
                  (position.height.endsWith('%') && parseInt(position.height, 10) < 20));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100px] p-4 bg-red-50 rounded-lg">
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

  // If no banner is found in the database, don't render anything
  if (!banner) return null;

  // Extract path from link_url if it's a URL
  const getLinkPath = (url: string) => {
    try {
      // Check if it's an internal link (starts with /)
      if (url.startsWith('/')) {
        return url;
      }
      
      // Check if it's a full URL
      const urlObj = new URL(url);
      
      // If it's the same domain, return just the path
      if (urlObj.hostname === window.location.hostname) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
      }
      
      // Otherwise, return the full URL
      return url;
    } catch (e) {
      // If parsing fails, return the original URL
      return url;
    }
  };

  // Check if the link is internal or external
  const isInternalLink = (url: string) => {
    if (!url) return false;
    
    try {
      // If it starts with /, it's internal
      if (url.startsWith('/')) return true;
      
      // Try to parse the URL
      const urlObj = new URL(url);
      
      // If it's the same domain, it's internal
      return urlObj.hostname === window.location.hostname;
    } catch (e) {
      // If parsing fails, assume it's internal
      return true;
    }
  };

  const bannerContent = (
    <div className="flex-1 overflow-hidden">
      {banner.link_url ? (
        isInternalLink(banner.link_url) ? (
          <Link
            to={getLinkPath(banner.link_url)}
            className="block hover:opacity-90 transition-opacity"
          >
            <div className={`flex ${isNarrow || isShort ? 'flex-col' : 'items-center'} gap-3`}>
              {banner.image_url && (
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className={`object-cover rounded-lg shadow-sm ${
                    isNarrow || isShort 
                      ? 'w-full h-20 object-cover' 
                      : 'w-36 h-36'
                  }`}
                />
              )}
              <div className={`${isNarrow || isShort ? 'mt-2 text-center' : ''}`}>
                <h3 className={`font-semibold text-green-800 ${
                  isNarrow || isShort ? 'text-sm' : 'text-xl'
                }`}>
                  {translateContent(banner.title)}
                </h3>
                {banner.content && !isShort && (
                  <p className={`text-green-600 mt-1 leading-tight ${
                    isNarrow ? 'text-xs' : 'text-base'
                  }`}>
                    {isNarrow 
                      ? (banner.content.length > 50 
                          ? translateContent(banner.content.substring(0, 50) + '...') 
                          : translateContent(banner.content))
                      : translateContent(banner.content)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity"
          >
            <div className={`flex ${isNarrow || isShort ? 'flex-col' : 'items-center'} gap-3`}>
              {banner.image_url && (
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className={`object-cover rounded-lg shadow-sm ${
                    isNarrow || isShort 
                      ? 'w-full h-20 object-cover' 
                      : 'w-36 h-36'
                  }`}
                />
              )}
              <div className={`${isNarrow || isShort ? 'mt-2 text-center' : ''}`}>
                <h3 className={`font-semibold text-green-800 ${
                  isNarrow || isShort ? 'text-sm' : 'text-xl'
                }`}>
                  {translateContent(banner.title)}
                </h3>
                {banner.content && !isShort && (
                  <p className={`text-green-600 mt-1 leading-tight ${
                    isNarrow ? 'text-xs' : 'text-base'
                  }`}>
                    {isNarrow 
                      ? (banner.content.length > 50 
                          ? translateContent(banner.content.substring(0, 50) + '...') 
                          : translateContent(banner.content))
                      : translateContent(banner.content)}
                  </p>
                )}
              </div>
            </div>
          </a>
        )
      ) : (
        <div className={`flex ${isNarrow || isShort ? 'flex-col' : 'items-center'} gap-3`}>
          {banner.image_url && (
            <img
              src={banner.image_url}
              alt={banner.title}
              className={`object-cover rounded-lg shadow-sm ${
                isNarrow || isShort 
                  ? 'w-full h-20 object-cover' 
                  : 'w-36 h-36'
              }`}
            />
          )}
          <div className={`${isNarrow || isShort ? 'mt-2 text-center' : ''}`}>
            <h3 className={`font-semibold text-green-800 ${
              isNarrow || isShort ? 'text-sm' : 'text-xl'
            }`}>
              {translateContent(banner.title)}
            </h3>
            {banner.content && !isShort && (
              <p className={`text-green-600 mt-1 leading-tight ${
                isNarrow ? 'text-xs' : 'text-base'
              }`}>
                {isNarrow 
                  ? (banner.content.length > 50 
                      ? translateContent(banner.content.substring(0, 50) + '...') 
                      : translateContent(banner.content))
                  : translateContent(banner.content)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`relative ${isEditing ? 'cursor-move' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: position.width,
        height: position.height,
        transition: isEditing ? 'none' : 'transform 0.3s ease',
        zIndex: position.zIndex || 10,
        border: isEditing ? '1px solid black' : 'none',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
      onMouseDown={e => handleDragStart(e)}
      onMouseUp={() => handleDragEnd()}
      onMouseLeave={() => handleDragEnd()}
      onMouseMove={e => handleDrag(e)}
    >
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg shadow-md h-full">
        <div className={`flex ${isNarrow ? 'flex-col' : 'items-center justify-between'} gap-4 h-full`}>
          {bannerContent}
          
          <Link
            to="/donation"
            className={`flex-shrink-0 flex ${isNarrow ? 'flex-row' : 'flex-col'} items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center ${
              isShort ? 'text-xs' : ''
            }`}
          >
            <Heart className={`${isNarrow || isShort ? 'w-4 h-4' : 'w-8 h-8'} text-red-500`} />
            <div>
              <div className={`font-semibold text-gray-800 ${isShort ? 'text-xs' : ''}`}>
                {isNarrow || isShort ? t('common.donation') : t('common.donation')}
              </div>
              {!isShort && (
                <p className={`${isNarrow ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
                  {isNarrow ? t('navigation.needDonation') : t('landing.donation.button')}
                  {!isNarrow && <br />}
                  {!isNarrow && t('landing.donation.benefits')}
                </p>
              )}
            </div>
          </Link>
        </div>
      </div>

      {isAdmin && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-2 max-w-[200px]">
          {isEditing ? (
            <>
              <button 
                onClick={() => savePosition(banner.id)}
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                title="Sauvegarder la position"
              >
                <Save className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                title="Annuler"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleResize('width', 50)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                title="Augmenter la largeur"
              >
                <Maximize className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleResize('width', -50)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                title="Diminuer la largeur"
              >
                <Minimize className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleResize('height', 50)}
                className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                title="Augmenter la hauteur"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleResize('height', -50)}
                className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                title="Diminuer la hauteur"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleZIndexChange(banner.id, 1)}
                className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700"
                title="Augmenter le z-index"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleZIndexChange(banner.id, -1)}
                className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700"
                title="Diminuer le z-index"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              title="Modifier la position"
            >
              <Move className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Size indicator */}
      {isEditing && (
        <div className="absolute bottom-0 right-0 bg-black text-white text-xs px-1 py-0.5 rounded-tl">
          {position.width} × {position.height} (z: {position.zIndex || 10})
        </div>
      )}
    </div>
  );
}

export default Banner;
