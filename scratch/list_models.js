import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY no encontrada en .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey 
});

async function listModels() {
  try {
    const result = await ai.models.list();
    let allModels = [];
    
    // The Pager in this SDK is usually an async iterator
    for await (const model of result) {
      allModels.push(model.name);
    }
    
    console.log("Modelos encontrados (todos):");
    allModels.forEach(name => console.log(`- ${name}`));
    
  } catch (error) {
    console.error("Error al listar modelos:", error);
  }
}

listModels();
