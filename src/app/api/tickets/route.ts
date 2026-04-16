import { generateContentWithFallback } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Evita el timeout de 15 segundos en Vercel por defecto

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

    const prompt = `Actúa como un profesor experto en evaluación formativa y diseño de remediales. 
Te he entregado dos documentos PDF:
1. La prueba original que rindieron los estudiantes.
2. Un reporte con los resultados del curso (donde puedes ver la distribución de respuestas y % de acierto por pregunta).

CONTEXTO PRIORITARIO:
Asignatura: ${asignatura}
Curso: ${curso}
Eje Crítico Detectado (más bajo): "${eje}" (Logro: ${logro}%)

TU TAREA:
1. Analiza el reporte de resultados y selecciona las **3 o 4 preguntas más críticas** (las que tengan menor porcentaje de acierto) que pertenezcan o estén directamente relacionadas con el eje "${eje}".
2. Busca esas preguntas en la prueba original para entender qué habilidad o conocimiento evalúan.
3. Identifica los distractores más votados (los errores más comunes) para esas preguntas.
4. Diseña un "Ticket de Salida Remedial" (10 minutos) que sirva como punto de partida para que el docente corrija estas confusiones.

EL TICKET DEBE INCLUIR (en formato Markdown atractivo):
1. **Foco del Remedial:** Una breve declaración: "Basado en el bajo desempeño en el eje ${eje}, hemos identificado confusiones críticas en las preguntas X, Y, Z. Este ticket aborda esos puntos para iniciar la mejora."
2. **Breve Explicación (El porqué del error):** 1 o 2 párrafos explicando pedagógicamente por qué los estudiantes se están confundiendo en este eje, basándote en los distractores analizados.
3. **Actividad de Superación:** Diseña 2 o 3 ejercicios nuevos (pueden ser breves, de opción múltiple o completar) que ataquen directamente la confusión de las preguntas analizadas.
4. **Pregunta de Aplicación Abierta:** Una pregunta que requiera que el alumno explique con sus palabras el concepto clave del eje "${eje}".
5. **Autoevaluación:** Una escala cualitativa sobre su seguridad en este tema.

IMPORTANTE: DEBES RESPONDER ESTRICTAMENTE EN FORMATO JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA:
{
  "ticket": "El contenido completo del ticket de salida en formato Markdown",
  "prompt_sugerido": "Un prompt detallado para que el docente use en otra IA, que resuma el hallazgo: 'Mis alumnos de ${curso} fallaron en el eje ${eje}, específicamente confundiendo A con B. Genera 5 ejercicios adicionales de tipo X para reforzar esto.' Incluye el OA o eje en la descripción."
}
No agregues texto fuera del JSON ni uses bloques de código marcados con backticks.`;

    const response = await generateContentWithFallback({
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
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Error al parsear el JSON de Gemini:", cleanJson);
      return NextResponse.json(
        { error: "La IA generó una respuesta con formato inválido. Por favor intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      text: parsedData.ticket,
      prompt: parsedData.prompt_sugerido
    });
  } catch (error: any) {
    console.error("Error generating ticket:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al procesar el archivo con Gemini." },
      { status: 500 }
    );
  }
}
