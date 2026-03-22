import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pdfPruebaBase64, pdfResultadosBase64, contexto } = body;

    if (!pdfPruebaBase64 || !pdfResultadosBase64) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios (pdf de prueba, pdf de resultados)" },
        { status: 400 }
      );
    }

    const { curso, asignatura, eje, logro } = contexto || {};

    const prompt = `Actúa como un profesor experto en evaluación formativa. 
Te he entregado dos documentos PDF:
1. La prueba original que rindieron los estudiantes.
2. Un reporte con los resultados del curso (donde puedes ver la distribución de respuestas y % de acierto por pregunta).

CONTEXTO DEL CURSO:
Este es un curso de ${curso} en la asignatura de ${asignatura}. El eje crítico a mejorar actualmente es "${eje}".

TAREA:
1. Revisa el PDF de Resultados y determina **cuál fue la pregunta específica con el mayor porcentaje de respuestas incorrectas** (la más descendida).
2. Busca esa pregunta específica en el PDF de la Prueba original para entender de qué trata.
3. Observa en los Resultados cuál fue el distractor principal (la alternativa incorrecta más votada) para esa pregunta.
4. Diseña un "Ticket de Salida" (Exit Ticket) de 5 minutos, listo para usar, que remedie la confusión exacta que originó ese error.

EL TICKET DEBE INCLUIR:
1. Una declaración inicial diciendo: "Basado en los resultados, la pregunta más descendida fue la Pregunta X. Aquí tienes un remedial:"
2. Una breve explicación (1 párrafo) de la trampa o error principal que los hizo fallar (sin culpar a los alumnos).
3. Un ejercicio nuevo conceptual de opción múltiple (con 3 opciones, inspiradas en el distractor original).
4. Una breve pregunta abierta de aplicación.
5. Una escala de autoevaluación (ej. del 1 al 3) sobre la comprensión del tema.

Usa un lenguaje motivador y adecuado para estudiantes de ${curso}. Forma un diseño atractivo en Markdown.

IMPORTANTE: DEBES RESPONDER ESTRICTAMENTE EN FORMATO JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA:
{
  "ticket": "El contenido completo del ticket de salida en formato Markdown",
  "prompt_sugerido": "Un excelente 'prompt' detallado que resuma el descubrimiento pedagógico que acabas de hacer (ej. 'Mis alumnos fallaron en la Pregunta X sobre Y concepto, confundiendo A con B'). Este prompt debe servir para que el docente lo copie y pegue en otra IA (como ChatGPT) y pida generar más material para atacar esta confusión exacta, sin necesitar los PDFs."
}
No agregues texto fuera del JSON ni uses bloques de código marcados con backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfPruebaBase64,
            }
          },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfResultadosBase64,
            }
          }
        ]
      }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Empty response from AI");
    
    // Safety replacement in case of markdown formatting
    const cleanJson = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({ 
      text: parsedData.ticket,
      prompt: parsedData.prompt_sugerido
    });
  } catch (error) {
    console.error("Error generating ticket:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el archivo con Gemini." },
      { status: 500 }
    );
  }
}
