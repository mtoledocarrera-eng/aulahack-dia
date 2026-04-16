import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

interface GenerateParams {
  contents: any[];
  config?: any;
}

/**
 * Intenta generar contenido usando una lista de modelos priorizados (escalonada).
 * Si falla el primero (por cuota o error), intenta con el siguiente.
 */
export async function generateContentWithFallback(params: GenerateParams) {
  const models = [
    'gemini-3.1-pro-preview',       // Máximo razonamiento (Sujeto a cuota)
    'gemini-3-flash-preview',       // Balance ideal (Principal)
    'gemini-3.1-flash-lite-preview',// Fallback de baja latencia
    'gemini-2.5-flash'              // Fallback estable de generación anterior
  ];

  let lastError = null;

  for (const modelId of models) {
    try {
      console.log(`Intentando generar contenido con modelo: ${modelId}`);
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: params.contents,
        config: params.config
      });

      if (!response.text) {
        throw new Error(`Respuesta vacía del modelo ${modelId}`);
      }

      return response;
    } catch (error: any) {
      lastError = error;
      const statusCode = error?.status || error?.statusCode;
      
      console.warn(`Error con modelo ${modelId}:`, error.message);

      // Si el error es una cuota (429) o un error de servidor (5xx), intentamos con el siguiente.
      // Si el error es de formato de prompt (400), probablemente falle en todos, pero igual seguiremos el loop.
      if (modelId === models[models.length - 1]) {
        // Si falló el último de la lista, lanzamos el error
        throw error;
      }
      
      console.info("Cambiando al siguiente modelo en la escala...");
      continue;
    }
  }

  throw lastError || new Error("Fallo desconocido en el sistema escalonado de IA");
}
