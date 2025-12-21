import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Safe language code extraction
  const currentLanguage = i18n.language?.substring(0, 2) || 'fr';
  const resolvedLanguage = i18n.resolvedLanguage?.substring(0, 2) || 'fr';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center space-x-1 hover:text-green-200"
        aria-label="Change language"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="w-5 h-5" />
        <span className="uppercase">{currentLanguage}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg py-2 z-50">
          <button 
            onClick={() => changeLanguage('fr')} 
            className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 ${resolvedLanguage === 'fr' ? 'font-bold text-green-700' : ''}`}
          >
            Français
          </button>
          <button 
            onClick={() => changeLanguage('en')} 
            className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 ${resolvedLanguage === 'en' ? 'font-bold text-green-700' : ''}`}
          >
            English
          </button>
          <button 
            onClick={() => changeLanguage('de')} 
            className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 ${resolvedLanguage === 'de' ? 'font-bold text-green-700' : ''}`}
          >
            Deutsch
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
