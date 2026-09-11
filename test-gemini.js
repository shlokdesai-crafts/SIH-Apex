import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

async function run() {
  const models = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log("Model initialized.");
  try {
     const result = await models.generateContent("Hello");
     console.log(result.response.text());
  } catch (e) {
     console.error(e);
  }
}
run();
