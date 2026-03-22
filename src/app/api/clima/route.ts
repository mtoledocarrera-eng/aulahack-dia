import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pdfSocioemocionalBase64, pdfConvivenciaBase64 } = body;

    if (!pdfSocioemocionalBase64 && !pdfConvivenciaBase64) {
      return NextResponse.json(
        { error: "Debes proveer al menos un documento PDF." },
        { status: 400 }
      );
    }

    const parts = [];
    
    const prompt = `Actúa como el psicólogo principal y orientador experto de un colegio.
A continuación, recibirás informes institucionales (PDFs del Diagnóstico Integral de Aprendizajes) con los resultados agregados de un curso. 
Pueden ser de "Aprendizaje Socioemocional", de "Convivencia Escolar" o ambos.

TAREA PRINCIPAL:
Analiza los datos estadísticos, gráficos y tablas de los documentos adjuntos y redacta una **"Radiografía Socioemocional y de Clima"** estructurada, clara y directa para que el Profesor Jefe del curso entienda rápidamente cómo está su grupo y qué acciones debe tomar.

LA RADIOGRAFÍA DEBE INCLUIR LAS SIGUIENTES SECCIONES (usa Markdown y emojis):

### 1. 🌡️ Termómetro Emocional del Curso
Un resumen máximo de 2 párrafos indicando las emociones predominantes (ej. ansiedad, alegría, frustración) que expresaron los estudiantes y su nivel de autorregulación.

### 2. 🤝 Clima y Convivencia Escolar
Identifica las principales fortalezas y las áreas más críticas en cuanto al trato entre compañeros, sentido de pertenencia y percepción de seguridad en el establecimiento.

### 3. 🚨 Alertas Grupales (Focos de Atención)
Enumera en viñetas (bullets) de 2 a 4 problemas estadísticos graves que el reporte evidencie (ej. "El 40% de los estudiantes indica que hay burlas frecuentes", "Bajo involucramiento motivacional", etc.).

### 4. 💡 3 Acciones Prácticas Sugeridas
Recomienda 3 estrategias o dinámicas concretas que el Profesor Jefe pueda implementar durante la Hora de Orientación (Consejo de Curso) para mejorar los puntos críticos detectados.

REGLAS DE FORMATO:
- Sé empático pero profesional y objetivo con los datos.
- No inventes cifras; básate estrictamente en los porcentajes y resultados de los PDFs.
- Si solo se adjuntó uno de los informes (ej. solo Socioemocional), adapta el análisis solo a esa información sin mencionar que falta el otro.
- Usa frases cortas y negritas para facilitar la lectura. No uses un saludo protocolar largo al inicio, ve directo al título de la radiografía.`;

    parts.push({ text: prompt });

    if (pdfSocioemocionalBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfSocioemocionalBase64,
        }
      });
    }

    if (pdfConvivenciaBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfConvivenciaBase64,
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: "user",
        parts: parts
      }],
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Error generating clima report:", error);
    return NextResponse.json(
      { error: "Error interno al procesar los archivos con Gemini." },
      { status: 500 }
    );
  }
}
