import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { objetivo, pdfPlanificacionBase64, contexto } = body;

    if (!objetivo && !pdfPlanificacionBase64) {
      return NextResponse.json(
        { error: "Debes proporcionar al menos el objetivo de la clase o adjuntar un PDF de planificación." },
        { status: 400 }
      );
    }

    const { curso, asignatura, ejeCritico, logroEje } = contexto || {};

    const prompt = `Actúa como un experto en Diseño Universal para el Aprendizaje (DUA) y pedagogía escolar.

CONTEXTO DEL CURSO:
Este es un curso de ${curso} en la asignatura de ${asignatura}. 
Según las evaluaciones recientes, **el eje más débil o crítico de este curso es "${ejeCritico}"** (con solo un ${logroEje}% de logro).

LA TAREA DEL DOCENTE:
El docente quiere planificar su próxima clase.
${objetivo ? `El objetivo principal de esta clase será: "${objetivo}"` : 'El docente ha adjuntado el PDF de su planificación.'}

TU TAREA:
Diseña una guía rápida, práctica y muy aplicable al aula con Adaptaciones DUA que ayuden a los estudiantes a lograr este objetivo de la clase, prestando especial atención a mitigar su debilidad estructural en el eje de "${ejeCritico}".

ESTRUCTURA REQUERIDA (En Markdown):
Inicia con un breve párrafo de aliento al docente.
Luego, divide las estrategias estrictamente en tres secciones basadas en las redes del DUA:

1. 🧠 **Redes Afectivas (El Por Qué del Aprendizaje):** 
   - 2 sugerencias prácticas de cómo captar su interés inicial basándose en el objetivo de la clase y compensando su debilidad en el eje crítico.
   
2. 👁️ **Redes de Reconocimiento (El Qué del Aprendizaje):**
   - 2 sugerencias de cómo presentarles el contenido visual, auditiva o kinestésicamente de forma distinta para que no tropiecen con los errores comunes de su eje más débil.

3. ✍️ **Redes Estratégicas (El Cómo del Aprendizaje):**
   - 2 alternativas de evaluación formativa de cierre (cómo los alumnos pueden demostrarte que aprendieron sin ser la típica guía de ejercicios).

Usa un tono empático, práctico, sin teoría innecesaria, dirígete al profesor dando ejemplos hiper-concretos.
${pdfPlanificacionBase64 ? 'PD: Basate también en el documento adjunto (Planificación) para hacer sugerencias que modifiquen o mejoren la actividad planeada allí.' : ''}
`;

    const parts: any[] = [{ text: prompt }];

    if (pdfPlanificacionBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfPlanificacionBase64,
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
    console.error("Error generating DUA strategies:", error);
    return NextResponse.json(
      { error: "Error interno al procesar con Gemini." },
      { status: 500 }
    );
  }
}
