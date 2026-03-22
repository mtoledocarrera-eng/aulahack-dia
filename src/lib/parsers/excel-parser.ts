import type {
  ResultadoCursoAcademico,
  ResultadoEstudiante,
  ResultadoPorEje,
  NivelLogro,
  AsignaturaAcademica,
  Periodo,
} from '@/lib/types/dia';
import * as XLSX from 'xlsx';

// ============================================
// DIA Excel Parser
// Parses the "Resultados de estudiantes" Excel
// files exported from the DIA platform.
// ============================================

/**
 * Detect metadata from filename.
 * Format: RBD7404_DIA_MATEMATICA_3_A_Resultados_de_estudiantes_Equipo_docente_Cierre_2025.xls
 */
function parseFilename(filename: string): {
  rbd: string;
  asignatura: AsignaturaAcademica;
  cursoNumero: string;
  cursoSeccion: string;
  periodo: Periodo;
  año: number;
} | null {
  // Normalize filename (remove path)
  const name = filename.replace(/^.*[\\/]/, '').replace(/\.xlsx?$/i, '');

  // Extract RBD
  const rbdMatch = name.match(/^(RBD\d+)/i);
  const rbd = rbdMatch ? rbdMatch[1] : '';

  // Extract subject
  let asignatura: AsignaturaAcademica = 'Lectura';
  if (/MATEMATICA/i.test(name)) asignatura = 'Matemática';
  else if (/LECTURA/i.test(name)) asignatura = 'Lectura';
  else if (/HISTORIA/i.test(name)) asignatura = 'Historia, Geografía y Ciencias Sociales';
  else if (/CIENCIAS\s*NATURALES/i.test(name)) asignatura = 'Ciencias Naturales';
  else if (/ESCRITURA/i.test(name)) asignatura = 'Escritura';
  else if (/INGLES/i.test(name)) asignatura = 'Inglés';

  // Extract course number and section
  // Pattern: _ASIGNATURA_3_A_ or _ASIGNATURA_1_A_
  const courseMatch = name.match(/_(\d+)_([A-Z])_/i);
  const cursoNumero = courseMatch ? courseMatch[1] : '1';
  const cursoSeccion = courseMatch ? courseMatch[2].toUpperCase() : 'A';

  // Extract periodo
  let periodo: Periodo = 'diagnostico';
  if (/Cierre/i.test(name)) periodo = 'cierre';
  else if (/Monitoreo|Intermedi/i.test(name)) periodo = 'monitoreo';
  else if (/Diagn[oó]stico/i.test(name)) periodo = 'diagnostico';

  // Extract year
  const yearMatch = name.match(/(\d{4})/g);
  const año = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : new Date().getFullYear();

  return { rbd, asignatura, cursoNumero, cursoSeccion, periodo, año };
}

/**
 * Parse a comma-decimal string to a number.
 * "82,14" -> 82.14
 */
function parseCommaNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  return parseFloat(String(value).replace(',', '.'));
}

/**
 * Parse a nivel de logro string.
 * "nivel I" -> "I", "nivel II" -> "II", "nivel III" -> "III"
 */
function parseNivelLogro(value: string): NivelLogro {
  const clean = String(value).trim().toLowerCase();
  if (clean.includes('iii') || clean.includes('3')) return 'III';
  if (clean.includes('ii') || clean.includes('2')) return 'II';
  return 'I';
}

/**
 * Find the row index where student data starts.
 * The header row contains "Número de Lista" and "Nombre del Estudiante".
 */
function findHeaderRow(data: unknown[][]): number {
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    const joined = row.map(c => String(c).toLowerCase()).join('|');
    if (joined.includes('número') && joined.includes('estudiante')) {
      return i;
    }
    if (joined.includes('lista') && joined.includes('nombre')) {
      return i;
    }
  }
  return 12; // Default based on observed data
}

/**
 * Extract the establishment name from the spreadsheet.
 */
function findEstablecimiento(data: unknown[][]): string {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    if (String(row[0]).toLowerCase().includes('establecimiento')) {
      return String(row[1] || '').trim();
    }
  }
  return '';
}

/**
 * Main parser function.
 * Takes a File object from the browser and returns parsed results.
 */
export async function parseExcelFile(
  file: File
): Promise<ResultadoCursoAcademico | null> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  if (wb.SheetNames.length === 0) return null;

  const ws = wb.Sheets[wb.SheetNames[0]];
  const data: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
  });

  // Parse metadata from filename
  const meta = parseFilename(file.name);
  if (!meta) return null;

  // Find establishment name
  const nombreEstablecimiento = findEstablecimiento(data);

  // Find header row (column labels)
  const headerRowIdx = findHeaderRow(data);
  const headerRow = data[headerRowIdx] as string[];

  // Identify axis columns (between "Nombre" and "NIVEL DE LOGRO")
  const nombreColIdx = 1; // Usually column 1
  const nivelColIdx = headerRow.length - 1; // Last column
  const ejesStartIdx = 2; // First axis column
  const ejesEndIdx = nivelColIdx - 1; // Last axis column

  // Extract axis names from header
  const ejesNames: string[] = [];
  for (let j = ejesStartIdx; j <= ejesEndIdx; j++) {
    const name = String(headerRow[j] || '').trim();
    if (name) ejesNames.push(name);
  }

  // Parse student data (rows after header)
  const estudiantes: ResultadoEstudiante[] = [];
  const ejesAccum: Record<string, { total: number; count: number }> = {};
  ejesNames.forEach(e => { ejesAccum[e] = { total: 0, count: 0 }; });

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[nombreColIdx]) continue;

    const nombre = String(row[nombreColIdx]).trim();
    if (!nombre) continue;

    const nivelStr = String(row[nivelColIdx] || 'nivel I').trim();
    const nivelLogro = parseNivelLogro(nivelStr);

    // Calculate student average from axes
    let totalPct = 0;
    let axisCount = 0;
    const resultadosPorEjeEstudiante: Record<string, number> = {};

    for (let j = ejesStartIdx; j <= ejesEndIdx; j++) {
      const val = parseCommaNumber(row[j] as string);
      const ejeName = ejesNames[j - ejesStartIdx];
      if (ejeName) {
        if (ejesAccum[ejeName]) {
          ejesAccum[ejeName].total += val;
          ejesAccum[ejeName].count += 1;
        }
        resultadosPorEjeEstudiante[ejeName] = val;
      }
      totalPct += val;
      axisCount++;
    }

    estudiantes.push({
      id: `${meta.cursoNumero}${meta.cursoSeccion}-${i}`,
      nombre,
      nivelLogro,
      puntaje: axisCount > 0 ? Math.round(totalPct / axisCount) : 0,
      resultadosPorEje: resultadosPorEjeEstudiante,
    });
  }

  // Calculate distribution of levels
  const cantidadPorNivel: Record<NivelLogro, number> = { I: 0, II: 0, III: 0 };
  estudiantes.forEach(e => { cantidadPorNivel[e.nivelLogro]++; });

  const total = estudiantes.length || 1;
  const distribucionNiveles: Record<NivelLogro, number> = {
    I: Math.round((cantidadPorNivel.I / total) * 100),
    II: Math.round((cantidadPorNivel.II / total) * 100),
    III: Math.round((cantidadPorNivel.III / total) * 100),
  };

  // Calculate results per axis
  const resultadosPorEje: ResultadoPorEje[] = ejesNames.map(eje => ({
    eje,
    porcentajeLogro: ejesAccum[eje].count > 0
      ? Math.round(ejesAccum[eje].total / ejesAccum[eje].count)
      : 0,
    totalPreguntas: 0,
    preguntasCorrectas: 0,
  }));

  const curso = `${meta.cursoNumero}_${meta.cursoSeccion}`;

  return {
    asignatura: meta.asignatura,
    curso,
    periodo: meta.periodo,
    año: meta.año,
    rbd: meta.rbd,
    totalEvaluados: estudiantes.length,
    distribucionNiveles,
    cantidadPorNivel,
    resultadosPorEje,
    resultadosPorPregunta: [],
    estudiantes,
  };
}

/**
 * Parse multiple Excel files.
 */
export async function parseMultipleFiles(
  files: File[]
): Promise<ResultadoCursoAcademico[]> {
  const results: ResultadoCursoAcademico[] = [];
  for (const file of files) {
    try {
      const result = await parseExcelFile(file);
      if (result) results.push(result);
    } catch (err) {
      console.error(`Error parsing ${file.name}:`, err);
    }
  }
  return results;
}
