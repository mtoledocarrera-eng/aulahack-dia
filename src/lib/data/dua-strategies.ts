import { AsignaturaAcademica } from '@/lib/types/dia';

export interface EstrategiaDUA {
  id: string;
  asignatura: AsignaturaAcademica | 'General';
  ejeCatalizador: string; // "Medición", "Reflexionar", etc.
  titulo: string;
  descripcion: string;
  queHacer: string[];
  queEvitar: string[];
  principioDUA: 'Representación' | 'Acción y Expresión' | 'Implicación';
}

export const ESTRATEGIAS_DUA_DB: EstrategiaDUA[] = [
  // --- LECTURA ---
  {
    id: 'lec-refl-01',
    asignatura: 'Lectura',
    ejeCatalizador: 'Reflexionar',
    titulo: 'Debates Estructurados con Roles Asignados',
    descripcion: 'Técnica para fomentar la reflexión sobre textos mediante la defensa de posturas opuestas.',
    queHacer: [
      'Asignar roles claros: "El que cuestiona", "El que busca evidencia", "El sintetizador".',
      'Usar preguntas abiertas que no tengan una única respuesta correcta.',
      'Permitir que los estudiantes preparen sus argumentos gráficamente o en esquemas antes de hablar.'
    ],
    queEvitar: [
      'Hacer preguntas de "Sí/No" o de respuesta literal.',
      'Permitir que solo los estudiantes más extrovertidos participen.',
      'Evaluar la "respuesta correcta" en lugar del "proceso argumentativo".'
    ],
    principioDUA: 'Acción y Expresión'
  },
  {
    id: 'lec-loc-01',
    asignatura: 'Lectura',
    ejeCatalizador: 'Localizar',
    titulo: 'Códice de Colores para Información Explícita',
    descripcion: 'Uso de un sistema de resaltado visual estandarizado para rastrear datos específicos.',
    queHacer: [
      'Asignar un color para "Quién", otro para "Dónde" y otro para "Cuándo".',
      'Trabajar párrafos cortos y progresar hacia textos más extensos.',
      'Modelar el proceso pensando en voz alta.'
    ],
    queEvitar: [
      'Pedir subrayar "lo más importante" sin dar un criterio.',
      'Usar textos con información oculta o figurativa para enseñar esta habilidad base.',
      'Penalizar el uso de demasiados colores.'
    ],
    principioDUA: 'Representación'
  },

  // --- MATEMÁTICA ---
  {
    id: 'mat-num-01',
    asignatura: 'Matemática',
    ejeCatalizador: 'Números y operaciones',
    titulo: 'Mercadito en el Aula (Cálculo Mental en Contexto)',
    descripcion: 'Simulación de transacciones para anclar el cálculo algorítmico a la realidad práctica.',
    queHacer: [
      'Usar folletos reales de supermercados.',
      'Permitir el uso de material concreto (billetes falsos) para estudiantes con menor nivel (Nivel I).',
      'Incentivar la estimación de resultados antes de hacer el cálculo exacto.'
    ],
    queEvitar: [
      'Limitar el ejercicio a simples guías de sumas y restas aisladas.',
      'Prohibir estrategias de cálculo propias del alumno (si cuenta con los dedos u objetos, déjalo).',
      'Enfocarse solo en la velocidad.'
    ],
    principioDUA: 'Implicación'
  },
  {
    id: 'mat-geom-01',
    asignatura: 'Matemática',
    ejeCatalizador: 'Geometría',
    titulo: 'Geometría Kinestésica y Modelado 3D',
    descripcion: 'Uso de palillos, plastilina o el propio cuerpo para construir cuerpos geométricos.',
    queHacer: [
      'Construir polígonos usando elásticos y un geoplano.',
      'Relacionar vértices y aristas con los materiales usados (bolita de plastilina = vértice).',
      'Desarmar cajas de cartón reales para entender las redes geométricas.'
    ],
    queEvitar: [
      'Enseñar geometría solo dibujando en la pizarra.',
      'Exigir la memorización de fórmulas antes de comprender la forma visualmente.',
      'Usar solo objetos 2D para explicar el 3D.'
    ],
    principioDUA: 'Representación'
  },

  // --- CIENCIAS / GENERAL ---
  {
    id: 'gen-analis-01',
    asignatura: 'General',
    ejeCatalizador: 'Cualquiera',
    titulo: 'Organizadores Gráficos Escalables',
    descripcion: 'Mapas conceptuales pre-estructurados con niveles de complejidad variable.',
    queHacer: [
      'Entregar plantillas con el esqueleto ya armado para niveles descendidos.',
      'Permitir completar con dibujos en lugar de texto si el estudiante lo prefiere.',
      'Construir un mapa gigante colaborativo en la pared de la sala.'
    ],
    queEvitar: [
      'Comenzar con la hoja en blanco.',
      'Penalizar ortografía al momento de evaluar la estructura lógica del pensamiento.',
      'Hacer que todos usen exactamente la misma plantilla sin opción a modificar.'
    ],
    principioDUA: 'Representación'
  }
];

export function getEstrategiasParaEje(asignatura: AsignaturaAcademica, eje: string): EstrategiaDUA[] {
  const especificas = ESTRATEGIAS_DUA_DB.filter(e => e.asignatura === asignatura && e.ejeCatalizador === eje);
  if (especificas.length > 0) return especificas;
  
  // Si no hay específicas, devolver una genérica
  const generales = ESTRATEGIAS_DUA_DB.filter(e => e.asignatura === 'General');
  return generales;
}
