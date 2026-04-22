import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

async function generateContentWithFallback(params) {
  const models = [
    'gemini-3.1-pro-preview', 
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash'
  ];

  let lastError = null;

  for (const modelId of models) {
    try {
      console.log(`Intentando generar contenido con modelo: ${modelId}`);
      // Simmulamos la eliminación de la línea que fallaba: ai.models.get(modelId)
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: params.contents
      });

      if (!response.text) {
        throw new Error(`Respuesta vacía del modelo ${modelId}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Error con modelo ${modelId}:`, error.message);
      if (modelId === models[models.length - 1]) throw error;
      console.info("Cambiando al siguiente modelo...");
      continue;
    }
  }
}

async function runTest() {
  try {
    const modelId = 'gemini-3.1-pro-preview';
    console.log(`Probando modelo: ${modelId}`);
    const res = await generateContentWithFallback({
      contents: [{ role: "user", parts: [{ text: "Repite: OK" }] }]
    });
    console.log("TEST EXITOSO. Respuesta:", res.text);
  } catch (e) {
    console.error("TEST FALLIDO:", e.message);
    if (e.status) console.error("Status:", e.status);
    if (e.details) console.error("Details:", JSON.stringify(e.details, null, 2));
  }
}

runTest();
