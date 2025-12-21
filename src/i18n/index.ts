import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en/translation.json';
import frTranslations from './locales/fr/translation.json';
import deTranslations from './locales/de/translation.json';

// Define resources structure
const resources = {
  en: { translation: enTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations }
};

export default i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true
    }
  });
