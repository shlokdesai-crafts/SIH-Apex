/**
 * Hugging Face Translation Service
 * 
 * Translates text between English, Hindi, and Marathi using
 * the Hugging Face Inference API with local caching to minimize API calls.
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string;
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Model mapping for each language pair
const MODEL_MAP: Record<string, string> = {
  'en-hi': 'Helsinki-NLP/opus-mt-en-hi',
  'en-mr': 'facebook/nllb-200-distilled-600M',
  'hi-en': 'Helsinki-NLP/opus-mt-hi-en',
  'mr-en': 'facebook/nllb-200-distilled-600M',
  'hi-mr': 'facebook/nllb-200-distilled-600M',
  'mr-hi': 'facebook/nllb-200-distilled-600M',
};

// NLLB language codes (different from ISO codes)
const NLLB_LANG_CODES: Record<string, string> = {
  en: 'eng_Latn',
  hi: 'hin_Deva',
  mr: 'mar_Deva',
};

// In-memory cache: "lang:text" -> translated text
const translationCache = new Map<string, string>();

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
 * Uses cache first, then falls back to Hugging Face API.
 */
export async function translateText(
  text: string,
  targetLang: 'en' | 'hi' | 'mr',
  sourceLang: 'en' | 'hi' | 'mr' = 'en'
): Promise<string> {
  // No translation needed if source == target
  if (sourceLang === targetLang) return text;

  // Skip empty strings
  if (!text || text.trim() === '') return text;

  // Check cache
  const cacheKey = `${targetLang}:${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  // Check if token is configured
  if (!HF_TOKEN || HF_TOKEN === 'your_huggingface_token_here') {
    console.warn('[TranslationService] No Hugging Face token configured. Using static translations only.');
    return text;
  }

  try {
    const pairKey = `${sourceLang}-${targetLang}`;
    const model = MODEL_MAP[pairKey];

    if (!model) {
      console.warn(`[TranslationService] No model found for ${pairKey}`);
      return text;
    }

    let translated: string;

    if (model.includes('nllb')) {
      // NLLB model requires special parameters
      translated = await callNLLB(text, sourceLang, targetLang, model);
    } else {
      // Helsinki-NLP / Opus models
      translated = await callOpus(text, model);
    }

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
 * Translates each individually (parallelized) for better caching.
 */
export async function translateBatch(
  texts: string[],
  targetLang: 'en' | 'hi' | 'mr',
  sourceLang: 'en' | 'hi' | 'mr' = 'en'
): Promise<string[]> {
  const promises = texts.map((text) => translateText(text, targetLang, sourceLang));
  return Promise.all(promises);
}

/**
 * Translate an object's string values (shallow).
 * Useful for translating API response objects.
 */
export async function translateObject<T extends Record<string, unknown>>(
  obj: T,
  targetLang: 'en' | 'hi' | 'mr',
  keysToTranslate?: string[],
  sourceLang: 'en' | 'hi' | 'mr' = 'en'
): Promise<T> {
  const result = { ...obj };
  const keys = keysToTranslate || Object.keys(obj);

  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = await translateText(value, targetLang, sourceLang);
    }
  }

  return result;
}

// ─── Internal API Callers ────────────────────────────────────────────

async function fetchWithRetry(url: string, options: RequestInit, retries = 4): Promise<Response> {
  console.log(`[fetchWithRetry] Starting request to ${url}`);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503) {
        try {
          const errJson = await response.clone().json();
          const waitTime = errJson.estimated_time ? Math.ceil(errJson.estimated_time * 1000) : 5000;
          console.log(`[fetchWithRetry] Model loading. Waiting ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise(r => setTimeout(r, Math.min(waitTime, 20000))); // wait up to 20s per retry
          continue;
        } catch (e) {
          console.log(`[fetchWithRetry] Model loading (no JSON). Waiting 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
      }
      return response;
    } catch (networkError) {
      console.warn(`[fetchWithRetry] Network error on attempt ${i + 1}:`, networkError);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 3000)); // wait 3s before retrying network error
        continue;
      }
      throw networkError;
    }
  }
  return fetch(url, options);
}

async function callOpus(text: string, model: string): Promise<string> {
  const response = await fetchWithRetry(`${HF_API_URL}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Opus API error ${response.status}: ${errText}`);
    throw new Error(`Opus API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && data.length > 0 && data[0].translation_text) {
    return data[0].translation_text;
  }
  throw new Error('Unexpected Opus API response format');
}

async function callNLLB(
  text: string,
  sourceLang: string,
  targetLang: string,
  model: string
): Promise<string> {
  const srcCode = NLLB_LANG_CODES[sourceLang];
  const tgtCode = NLLB_LANG_CODES[targetLang];

  const response = await fetchWithRetry(`${HF_API_URL}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        src_lang: srcCode,
        tgt_lang: tgtCode,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`NLLB API error ${response.status}: ${errText}`);
    throw new Error(`NLLB API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && data.length > 0 && data[0].translation_text) {
    return data[0].translation_text;
  }
  throw new Error('Unexpected NLLB API response format');
}

/**
 * Clear the translation cache (both in-memory and localStorage).
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  localStorage.removeItem('cropguard_translation_cache');
}

/**
 * Get cache statistics for debugging.
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys()),
  };
}
