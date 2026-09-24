import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { translateText } from '../services/translationService';

interface TranslatedTextProps {
  text: string;
  sourceLanguage?: 'en' | 'hi' | 'mr';
  className?: string;
  tagName?: React.ElementType;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  text, 
  sourceLanguage = 'en',
  className = '',
  tagName = 'span'
}) => {
  const { language } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState<string>(text);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    // If the selected language is the same as the source, don't translate
    if (language === sourceLanguage || !text || text.trim() === '') {
      setTranslatedContent(text);
      return;
    }

    const performTranslation = async () => {
      setIsLoading(true);
      try {
        const result = await translateText(text, language, sourceLanguage);
        if (isMounted) {
          setTranslatedContent(result);
        }
      } catch (error) {
        console.error('Translation failed:', error);
        // Fallback to original text is handled by translateText
        if (isMounted) {
          setTranslatedContent(text);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
    };
  }, [text, language, sourceLanguage]);

  const Tag = tagName;

  return React.createElement(
    Tag,
    { 
      className: `${className} ${isLoading ? 'translating' : ''}`,
      'data-translating': isLoading,
      style: isLoading ? { opacity: 0.7, transition: 'opacity 0.2s' } : { transition: 'opacity 0.2s' }
    },
    translatedContent
  );
};

export default TranslatedText;
