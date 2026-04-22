import { generateContentWithFallback } from "../src/lib/ai/gemini.js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testGeneration() {
  try {
    console.log("Iniciando prueba de generación con fallback...");
    const response = await generateContentWithFallback({
      contents: [{
        role: "user",
        parts: [{ text: "Hola, ¿quién eres?" }]
      }]
    });
    console.log("Respuesta obtenida con éxito:");
    console.log(response.text);
  } catch (error) {
    console.error("Error en la prueba de generación:", error);
  }
}

testGeneration();
