import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { estudiantes, contexto } = body;

    if (!estudiantes || !Array.isArray(estudiantes) || estudiantes.length === 0) {
      return NextResponse.json(
        { error: "No se enviaron datos de estudiantes válidos." },
        { status: 400 }
      );
    }

    const { curso, asignatura, eje } = contexto || {};

    // Transform array to a readable string format to save tokens
    const listaEstudiantesStr = estudiantes
      .map((e: { nombre: string; puntaje: number }) => "- " + e.nombre + ": " + e.puntaje + "%")
      .join("\n");

    const prompt = [
      "Actúa como un Coordinador Académico experto en Aprendizaje Colaborativo y Tutoría entre Pares.",
      "",
      "CONTEXTO DEL CURSO:",
      "Curso: " + curso,
      "Asignatura: " + asignatura,
      'Eje Temático a trabajar: "' + eje + '"',
      "",
      "ESTUDIANTES Y SUS PUNTAJES EN ESTE EJE:",
      listaEstudiantesStr,
      "",
      "TU TAREA:",
      "1. Analiza los puntajes y agrupa a TODOS los estudiantes de la lista en PAREJAS (o un trío si el número de alumnos es impar). Nadie puede quedar afuera.",
      "2. Agrupa maximizando el potencial de apoyo mutuo. Por ejemplo, junta a un estudiante de alto rendimiento (>75%) con uno que necesite mucho apoyo (<60%). Si te sobran estudiantes de rendimiento medio (60-74%), agrúpalos juntos para que investiguen a la par.",
      '3. Propón una dinámica rápida de Tutoría entre Pares (15 minutos) específica para trabajar conceptos que suelen ser difíciles en el eje "' + eje + '".',
      "",
      "IMPORTANTE: DEBES RESPONDER ESTRICTAMENTE EN FORMATO JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA:",
      '{',
      '  "parejas": [',
      '    {',
      '      "tutor": "Nombre del alumno que guiará (o colega)",',
      '      "apoyo": "Nombre del alumno que recibirá apoyo (o colega)",',
      '      "razon": "Breve justificación de por qué los juntaste"',
      '    }',
      '  ],',
      '  "dinamica": "# Título de la Dinámica en Markdown\\n\\nInstrucciones de la dinámica de 15 minutos en formato Markdown explícito. Debe incluir los roles: Qué hace el Tutor (cómo guía sin dar la respuesta) y Qué hace el Apoyo."',
      '}',
      "No agregues texto fuera del JSON ni uses bloques de código marcados con backticks."
    ].join("\n");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Empty response from AI");
    
    const parsedData = JSON.parse(outputText.trim());

    return NextResponse.json({ 
      parejas: parsedData.parejas,
      dinamica: parsedData.dinamica
    });
  } catch (error) {
    console.error("Error generating Match:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el emparejamiento con Gemini." },
      { status: 500 }
    );
  }
}
