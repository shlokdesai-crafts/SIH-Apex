import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';

/**
 * Hook for translating dynamic data from APIs or databases.
 * 
 * When the language changes or new data arrives, it automatically
 * translates all string values using the Hugging Face API.
 * Returns the translated data with a loading state.
 * 
 * Usage:
 *   const apiData = { title: "Risk Alert", description: "Heavy rain expected" };
 *   const { translatedData, isLoading } = useDynamicTranslation(apiData, ['title', 'description']);
 */
export function useDynamicTranslation<T extends Record<string, unknown>>(
  data: T | null,
  keysToTranslate: string[]
): { translatedData: T | null; isLoading: boolean } {
  const { language, translateDynamic } = useTranslation();
  const [translatedData, setTranslatedData] = useState<T | null>(data);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    if (!data) {
      setTranslatedData(null);
      return;
    }

    // No translation needed for English (source language)
    if (language === 'en') {
      setTranslatedData(data);
      return;
    }

    const translateData = async () => {
      setIsLoading(true);
      try {
        const result = { ...data };
        for (const key of keysToTranslate) {
          if (abortRef.current) return;
          const value = data[key];
          if (typeof value === 'string' && value.trim()) {
            (result as Record<string, unknown>)[key] = await translateDynamic(value);
          }
        }
        if (!abortRef.current) {
          setTranslatedData(result);
        }
      } catch (error) {
        console.error('[useDynamicTranslation] Error:', error);
        if (!abortRef.current) {
          setTranslatedData(data); // Fallback to original
        }
      } finally {
        if (!abortRef.current) {
          setIsLoading(false);
        }
      }
    };

    translateData();

    return () => {
      abortRef.current = true;
    };
  }, [data, language, keysToTranslate, translateDynamic]);

  return { translatedData, isLoading };
}

/**
 * Hook for translating a simple string array from API/DB.
 * 
 * Usage:
 *   const alerts = ["Heavy rain", "Pest outbreak"];
 *   const { translatedItems, isLoading } = useDynamicArrayTranslation(alerts);
 */
export function useDynamicArrayTranslation(
  items: string[]
): { translatedItems: string[]; isLoading: boolean } {
  const { language, translateDynamicBatch } = useTranslation();
  const [translatedItems, setTranslatedItems] = useState<string[]>(items);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    if (language === 'en') {
      setTranslatedItems(items);
      return;
    }

    const translateAll = async () => {
      setIsLoading(true);
      try {
        const results = await translateDynamicBatch(items);
        if (!abortRef.current) {
          setTranslatedItems(results);
        }
      } catch (error) {
        console.error('[useDynamicArrayTranslation] Error:', error);
        if (!abortRef.current) {
          setTranslatedItems(items);
        }
      } finally {
        if (!abortRef.current) {
          setIsLoading(false);
        }
      }
    };

    translateAll();

    return () => {
      abortRef.current = true;
    };
  }, [items, language, translateDynamicBatch]);

  return { translatedItems, isLoading };
}
