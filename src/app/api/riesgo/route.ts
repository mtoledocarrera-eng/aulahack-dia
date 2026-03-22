import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, curso, nivelRiesgo, promedioGeneral, resultados } = body;

    if (!nombre || !resultados || !Array.isArray(resultados)) {
      return NextResponse.json(
        { error: "Datos del estudiante incompletos." },
        { status: 400 }
      );
    }

    const detalleAsignaturas = resultados
      .map((r: { asignatura: string; nivel: string; puntaje: number }) =>
        "- " + r.asignatura + ": " + r.puntaje + "% (Nivel de Logro: " + r.nivel + ")"
      )
      .join("\n");

    const prompt = [
      "Actúa como un Orientador Escolar y Psicopedagogo experto en intervención temprana.",
      "",
      "FICHA DEL ESTUDIANTE:",
      "Nombre: " + nombre,
      "Curso: " + curso,
      "Nivel de Riesgo Detectado: " + nivelRiesgo,
      "Promedio General: " + promedioGeneral + "%",
      "",
      "RESULTADOS POR ASIGNATURA:",
      detalleAsignaturas,
      "",
      "GENERA UNA FICHA CLÍNICA PEDAGÓGICA en formato Markdown con las siguientes secciones:",
      "",
      "## 1. Diagnóstico Personalizado",
      "Análisis cualitativo del perfil académico. Identifica patrones (ej: debilidad transversal en comprensión lectora que afecta todas las asignaturas, o dificultad focalizada en un área). Sé empático pero directo.",
      "",
      "## 2. Plan de Intervención Semanal",
      "Exactamente 3 acciones concretas, realistas y ejecutables que el profesor jefe puede implementar ESTA semana. Cada acción debe tener:",
      "- Un título claro",
      "- Quién la ejecuta (profesor jefe, profesor de asignatura, apoderado)",
      "- Duración estimada",
      "- Resultado esperado",
      "",
      "## 3. Señales de Alerta a Monitorear",
      "3 indicadores observables (conductuales o académicos) que el profesor debe vigilar en las próximas 2 semanas para saber si el plan está funcionando o si necesita escalar la intervención.",
      "",
      "Usa un tono profesional pero cálido. Recuerda que esto lo leerá un profesor que quiere ayudar a su alumno."
    ].join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Empty response from AI");

    return NextResponse.json({ ficha: outputText });
  } catch (error) {
    console.error("Error generating risk profile:", error);
    return NextResponse.json(
      { error: "Error interno al generar la ficha de riesgo." },
      { status: 500 }
    );
  }
}
