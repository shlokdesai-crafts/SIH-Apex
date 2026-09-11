import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

async function run() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
  } catch (e) {
    console.error(e);
  }
}

run();
