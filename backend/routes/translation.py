import json
import os
import urllib.error
import urllib.request
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Token will be fetched inside the function

# We use NLLB-200 as it supports English, Hindi, and Marathi well
MODEL_ID = "facebook/nllb-200-distilled-600M"
API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"

# Map common language codes to NLLB codes
LANG_MAP = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "mr": "mar_Deva",
    "eng_Latn": "eng_Latn",
    "hin_Deva": "hin_Deva",
    "mar_Deva": "mar_Deva"
}

class TranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str

class BatchTranslateRequest(BaseModel):
    texts: list[str]
    source_language: str
    target_language: str

def translate_text(text: str, src: str, tgt: str) -> str:
    if not text or not text.strip():
        return text
        
    src_code = LANG_MAP.get(src, src)
    tgt_code = LANG_MAP.get(tgt, tgt)
    
    if src_code == tgt_code:
        return text
        
    token = os.getenv("MULTILINGUAL_API") or os.getenv("HF_TOKEN") or os.getenv("VITE_MULTILINGUAL_API") or os.getenv("VITE_HF_TOKEN")
    if not token:
        print("Neither MULTILINGUAL_API nor HF_TOKEN is configured in environment.")
        return text
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "CropGuard-App",
    }
    
    payload = {
        "inputs": text,
        "parameters": {
            "src_lang": src_code,
            "tgt_lang": tgt_code
        }
    }
    
    try:
        req = urllib.request.Request(API_URL, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            
            if isinstance(data, list) and len(data) > 0 and 'translation_text' in data[0]:
                return data[0]['translation_text']
            elif isinstance(data, dict) and 'translation_text' in data:
                return data['translation_text']
            else:
                print("Unexpected translation format:", data)
                return text
                
    except urllib.error.HTTPError as e:
        if e.code == 503:
            # Model loading, fallback to original text rather than blocking
            print("Model is currently loading (503).")
            return text
        print(f"Translation API HTTP error (returning original text): {e}")
        return text
    except Exception as e:
        print(f"Translation error (returning original text): {repr(e)}")
        return text

@router.post("/translate")
async def translate_single(req: TranslateRequest):
    result = translate_text(req.text, req.source_language, req.target_language)
    return {"translated_text": result}

@router.post("/translate/batch")
async def translate_batch(req: BatchTranslateRequest):
    translations = []
    for text in req.texts:
        try:
            translations.append(translate_text(text, req.source_language, req.target_language))
        except Exception:
            # Fallback to original text if one fails in batch
            translations.append(text)
    return {"translations": translations}
