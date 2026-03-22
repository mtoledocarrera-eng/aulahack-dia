import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env.local y .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Error: No se encontró GEMINI_API_KEY en el entorno o en el archivo .env.local");
  console.log("   Por favor, crea un archivo .env.local en la carpeta raíz y añade:");
  console.log("   GEMINI_API_KEY=tu_clave_api_aqui");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("❌ Error: Debes proporcionar la ruta a un archivo PDF.");
  console.log("   Uso: node test-pdf-gemini.mjs <ruta-al-pdf>");
  process.exit(1);
}

const pdfPath = args[0];

if (!fs.existsSync(pdfPath)) {
  console.error(`❌ Error: El archivo "${pdfPath}" no existe.`);
  process.exit(1);
}

async function main() {
  console.log(`⏳ Leyendo y analizando PDF: ${pdfPath}...`);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const pdfBase64 = fs.readFileSync(pdfPath, { encoding: "base64" });

    const prompt = `
Eres un asistente experto en psicología educativa.
A continuación te presento un registro de "Día Emocional" de un estudiante, en formato PDF.
Por favor, analiza el contenido del documento y extrae la siguiente información de forma estructurada:
1. Emociones principales identificadas de forma clara y concisa.
2. Posibles desencadenantes de estas emociones (si se mencionan).
3. ¿Existe alguna "Alerta de Riesgo" que un docente o psicólogo deba atender de inmediato? (Responde Sí o No, y por qué).
4. Un breve resumen (máximo 3 líneas) de la situación emocional del estudiante.

Formatea tu respuesta usando Markdown.
`;

    // Usamos el modelo generativo, no el de embeddings, porque queremos extraer y resumir información.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            }
          }
        ]
      }],
    });

    console.log("\n✅ Análisis completado:\n");
    console.log("==========================================");
    console.log(response.text);
    console.log("==========================================\n");

  } catch (error) {
    console.error("❌ Ocurrió un error al procesar el PDF:");
    console.error(error);
  }
}

main();
