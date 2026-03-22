// ============================================
// DIA - Diagnóstico Integral de Aprendizajes
// Type definitions
// ============================================

// --- Enums & Constants ---

export type Periodo = 'diagnostico' | 'monitoreo' | 'cierre';

export type NivelLogro = 'I' | 'II' | 'III';

export type AsignaturaAcademica =
  | 'Lectura'
  | 'Matemática'
  | 'Historia, Geografía y Ciencias Sociales'
  | 'Ciencias Naturales'
  | 'Escritura'
  | 'Inglés';

export type AreaEvaluacion = 'academica' | 'socioemocional' | 'convivencia';

export type NivelApoyo = 'universal' | 'focalizado' | 'intensivo';

export type DimensionSocioemocional = 'Personal' | 'Comunitario' | 'Ciudadano';

// --- Ejes Temáticos por Asignatura ---

export const EJES_POR_ASIGNATURA: Record<AsignaturaAcademica, string[]> = {
  'Lectura': ['Localizar', 'Interpretar y relacionar', 'Reflexionar'],
  'Matemática': ['Números y operaciones', 'Patrones y álgebra', 'Geometría', 'Medición', 'Datos y probabilidades'],
  'Historia, Geografía y Ciencias Sociales': ['Historia', 'Geografía', 'Formación ciudadana'],
  'Ciencias Naturales': ['Biología', 'Física', 'Química'],
  'Escritura': ['Propósito y estructura textual', 'Coherencia y uso de conectores', 'Desarrollo de ideas', 'Vocabulario', 'Ortografía'],
  'Inglés': ['Listening', 'Reading', 'Writing'],
};

export const PERIODOS_LABELS: Record<Periodo, string> = {
  diagnostico: 'Diagnóstico',
  monitoreo: 'Monitoreo Intermedio',
  cierre: 'Cierre',
};

export const NIVEL_LOGRO_LABELS: Record<NivelLogro, string> = {
  'I': 'No logra aprendizajes mínimos',
  'II': 'Logra parcialmente',
  'III': 'Logra satisfactoriamente',
};

export const NIVEL_LOGRO_COLORS: Record<NivelLogro, string> = {
  'I': '#EF4444',   // Red
  'II': '#F59E0B',  // Amber
  'III': '#10B981', // Green
};

// --- Resultados Académicos ---

export interface RespuestaPregunta {
  numeroPregunta: number;
  indicador: string;
  eje: string;
  alternativaCorrecta?: string;
  porcentajeCorrectas: number;
  porcentajeIncorrectas: number;
  porcentajeOmitidas: number;
  distribucionAlternativas?: Record<string, number>; // A: 30%, B: 45%, etc.
}

export interface ResultadoEstudiante {
  id: string;
  nombre: string;
  nivelLogro: NivelLogro;
  puntaje?: number;
  respuestas?: boolean[]; // true = correcta, false = incorrecta/omitida
  resultadosPorEje?: Record<string, number>; // e.g. { "Medición": 85, "Geometría": 40 }
}

export interface ResultadoPorEje {
  eje: string;
  porcentajeLogro: number;
  totalPreguntas: number;
  preguntasCorrectas: number;
}

export interface ResultadoCursoAcademico {
  asignatura: AsignaturaAcademica;
  curso: string; // e.g. "3_A", "5_A"
  periodo: Periodo;
  año: number;
  rbd: string;
  totalEvaluados: number;
  totalMatriculados?: number;
  distribucionNiveles: Record<NivelLogro, number>; // Porcentajes
  cantidadPorNivel: Record<NivelLogro, number>;    // Cantidades
  resultadosPorEje: ResultadoPorEje[];
  resultadosPorPregunta: RespuestaPregunta[];
  estudiantes: ResultadoEstudiante[];
}

// --- Resultados Socioemocionales ---

export interface PreguntaSocioemocional {
  numeroPregunta: number;
  texto: string;
  dimension: DimensionSocioemocional;
  foco: string;
  porcentajeRF: number;  // Respuestas Favorables
  porcentajeRNF: number; // Respuestas No Favorables
  porcentajeNulo: number;
}

export interface ResultadoSocioemocional {
  curso: string;
  periodo: Periodo;
  año: number;
  rbd: string;
  totalEvaluados: number;
  porcentajeRFGlobal: number;
  porcentajeRNFGlobal: number;
  resultadosPorDimension: {
    dimension: DimensionSocioemocional;
    porcentajeRF: number;
    porcentajeRNF: number;
  }[];
  preguntas: PreguntaSocioemocional[];
}

// --- Resultados Convivencia ---

export interface PreguntaConvivencia {
  numeroPregunta: number;
  texto: string;
  area: string;
  porcentajeRF: number;
  porcentajeRNF: number;
  porcentajeNulo: number;
}

export interface ResultadoConvivencia {
  curso: string;
  periodo: Periodo;
  año: number;
  rbd: string;
  totalEvaluados: number;
  nivelApoyo: NivelApoyo;
  distribucionNiveles: Record<NivelApoyo, number>;
  preguntas: PreguntaConvivencia[];
}

// --- Contenedor Principal ---

export interface DatosDIA {
  rbd: string;
  nombreEstablecimiento: string;
  año: number;
  academicos: ResultadoCursoAcademico[];
  socioemocionales: ResultadoSocioemocional[];
  convivencia: ResultadoConvivencia[];
}

// --- Helpers ---

export function getCursoLabel(curso: string): string {
  const [nivel, seccion] = curso.split('_');
  const suffix = nivel === '1' ? '°' : '°';
  return `${nivel}${suffix} ${seccion || ''}`.trim();
}

export function getAsignaturaShort(asignatura: AsignaturaAcademica): string {
  const map: Record<AsignaturaAcademica, string> = {
    'Lectura': 'Lectura',
    'Matemática': 'Matemática',
    'Historia, Geografía y Ciencias Sociales': 'Historia',
    'Ciencias Naturales': 'Cs. Naturales',
    'Escritura': 'Escritura',
    'Inglés': 'Inglés',
  };
  return map[asignatura];
}
