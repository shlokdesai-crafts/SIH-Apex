import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';

/**
 * Custom hook for consuming the language context.
 * 
 * Usage:
 *   const { t, language, setLanguage, translateDynamic } = useTranslation();
 *   
 *   // Static text (instant):
 *   <h1>{t('header.brand')}</h1>
 *   
 *   // Dynamic API data (async):
 *   const translated = await translateDynamic(apiData.description);
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
