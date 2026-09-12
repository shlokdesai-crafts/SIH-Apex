import { GoogleGenerativeAI } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const hf = new HfInference(HF_TOKEN || '');

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!HF_TOKEN) {
    throw new Error("Hugging Face token is missing.");
  }
  
  // You can use a model like openai/whisper-large-v3 which is multilingual
  try {
    const result = await hf.automaticSpeechRecognition({
      model: 'openai/whisper-large-v3',
      data: audioBlob,
    });
    return result.text;
  } catch (error) {
    console.error("Error transcribing audio with Hugging Face:", error);
    throw error;
  }
}

export async function generateAssistantResponse(prompt: string, languageCode: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing.");
  }

  const langMap: Record<string, string> = {
    'en': 'English',
    'hi': 'Hindi',
    'mr': 'Marathi'
  };
  const language = langMap[languageCode] || 'English';

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const systemPrompt = `You are an expert AI agricultural assistant. Please respond concisely and accurately. 
CRITICAL: You MUST respond in ${language}. Do NOT mix languages. Ensure grammatical correctness in ${language}.`;
    
    const result = await model.generateContent(`${systemPrompt}\nUser: ${prompt}`);
    return result.response.text();
  } catch (error) {
    console.error("Error generating response with Gemini:", error);
    throw error;
  }
}
