/**
 * Translation Service
 * 
 * Translates text between English, Hindi, and Marathi using
 * the backend FastAPI endpoint which securely communicates with Hugging Face.
 */

// In-memory cache: "lang:text" -> translated text
const translationCache = new Map<string, string>();

// Base API URL (assumes backend is on localhost:8000 in dev, or same domain in prod)
const API_BASE_URL = 'http://localhost:8000/api';

// Load cache from localStorage on init
function loadCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem('cropguard_translation_cache');
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, string>;
      for (const [key, value] of Object.entries(parsed)) {
        translationCache.set(key, value);
      }
    }
  } catch {
    // Silently ignore corrupted cache
  }
}

// Persist cache to localStorage
function saveCacheToStorage(): void {
  try {
    const obj: Record<string, string> = {};
    translationCache.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem('cropguard_translation_cache', JSON.stringify(obj));
  } catch {
    // Silently ignore storage errors
  }
}

// Initialize cache on module load
loadCacheFromStorage();

/**
 * Translate a single text string to the target language.
 * Uses cache first, then falls back to backend API.
 */
export async function translateText(
  text: string,
  targetLang: 'en' | 'hi' | 'mr',
  sourceLang: 'en' | 'hi' | 'mr' = 'en'
): Promise<string> {
  // No translation needed if source == target
  if (sourceLang === targetLang) return text;

  // Skip empty strings or non-strings
  if (!text || typeof text !== 'string' || text.trim() === '') return text;

  // Check cache
  const cacheKey = `${sourceLang}|${targetLang}|${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source_language: sourceLang,
        target_language: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const translated = data.translated_text || text;

    // Cache the result
    translationCache.set(cacheKey, translated);
    saveCacheToStorage();

    return translated;
  } catch (error) {
    console.error('[TranslationService] Translation failed:', error);
    return text; // Fallback to original text
  }
}

/**
 * Translate a batch of texts to the target language.
 */
export async function translateBatch(
  texts: string[],
  targetLang: 'en' | 'hi' | 'mr',
  sourceLang: 'en' | 'hi' | 'mr' = 'en'
): Promise<string[]> {
  if (sourceLang === targetLang || !texts || texts.length === 0) return texts;

  // Find which texts are not in cache
  const uncachedTexts: string[] = [];
  const results: string[] = new Array(texts.length);
  
  texts.forEach((text, index) => {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      results[index] = text;
      return;
    }
    
    const cacheKey = `${sourceLang}|${targetLang}|${text}`;
    const cached = translationCache.get(cacheKey);
    
    if (cached) {
      results[index] = cached;
    } else {
      uncachedTexts.push(text);
    }
  });

  if (uncachedTexts.length === 0) {
    return results;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/translate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: uncachedTexts,
        source_language: sourceLang,
        target_language: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const translations = data.translations || uncachedTexts;

    // Cache the new translations and place in results
    let translatedIndex = 0;
    texts.forEach((text, index) => {
      if (results[index] === undefined) {
        const translated = translations[translatedIndex] || text;
        const cacheKey = `${sourceLang}|${targetLang}|${text}`;
        translationCache.set(cacheKey, translated);
        results[index] = translated;
        translatedIndex++;
      }
    });

    saveCacheToStorage();
    return results;
  } catch (error) {
    console.error('[TranslationService] Batch translation failed:', error);
    // Fill remaining with original text
    texts.forEach((text, index) => {
      if (results[index] === undefined) {
        results[index] = text;
      }
    });
    return results;
  }
}

/**
 * Translate an object's string values (shallow).
 */
export async function translateObject<T extends Record<string, unknown>>(
  obj: T,
  targetLang: 'en' | 'hi' | 'mr',
  keysToTranslate?: string[],
  sourceLang: 'en' | 'hi' | 'mr' = 'en'
): Promise<T> {
  const result = { ...obj };
  const keys = keysToTranslate || Object.keys(obj);
  
  const valuesToTranslate = keys.map(k => obj[k]).filter(v => typeof v === 'string') as string[];
  
  if (valuesToTranslate.length > 0) {
    const translatedValues = await translateBatch(valuesToTranslate, targetLang, sourceLang);
    let vIndex = 0;
    for (const key of keys) {
      if (typeof obj[key] === 'string') {
        (result as Record<string, unknown>)[key] = translatedValues[vIndex++];
      }
    }
  }

  return result;
}

export function clearTranslationCache(): void {
  translationCache.clear();
  localStorage.removeItem('cropguard_translation_cache');
}
