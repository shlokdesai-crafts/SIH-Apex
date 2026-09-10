import { createContext, useState, useCallback, type ReactNode } from 'react';
import { getTranslation, type Language } from './translations';
import { translateText, translateBatch } from '../services/translationService';

interface LanguageContextType {
  /** Current active language */
  language: Language;
  /** Switch the active language */
  setLanguage: (lang: Language) => void;
  /** Translate a static UI key instantly from the dictionary */
  t: (key: string) => string;
  /** Translate dynamic text via Hugging Face API (async, with cache) */
  translateDynamic: (text: string) => Promise<string>;
  /** Translate a batch of dynamic texts via Hugging Face API */
  translateDynamicBatch: (texts: string[]) => Promise<string[]>;
  /** Whether any dynamic translation is in progress */
  isTranslating: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  translateDynamic: async (text: string) => text,
  translateDynamicBatch: async (texts: string[]) => texts,
  isTranslating: false,
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Restore language preference from localStorage
    const stored = localStorage.getItem('cropguard_language');
    return (stored as Language) || 'en';
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cropguard_language', lang);
    // Set HTML lang attribute for accessibility
    document.documentElement.lang = lang;
  }, []);

  // Static translation (instant, from dictionary)
  const t = useCallback(
    (key: string): string => {
      return getTranslation(key, language);
    },
    [language]
  );

  // Dynamic translation (async, via HF API)
  const translateDynamic = useCallback(
    async (text: string): Promise<string> => {
      if (language === 'en') return text;
      setIsTranslating(true);
      try {
        const result = await translateText(text, language, 'en');
        return result;
      } finally {
        setIsTranslating(false);
      }
    },
    [language]
  );

  // Batch dynamic translation
  const translateDynamicBatch = useCallback(
    async (texts: string[]): Promise<string[]> => {
      if (language === 'en') return texts;
      setIsTranslating(true);
      try {
        const results = await translateBatch(texts, language, 'en');
        return results;
      } finally {
        setIsTranslating(false);
      }
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateDynamic,
        translateDynamicBatch,
        isTranslating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
