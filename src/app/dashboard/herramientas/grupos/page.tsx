'use client';

import { useDIAStore } from '@/lib/store/dia-store';
import { getCursoLabel, EJES_POR_ASIGNATURA, type AsignaturaAcademica, type Periodo } from '@/lib/types/dia';
import { Users, AlertCircle, ArrowRightLeft, Bot, Loader2, Copy, Check, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIPair {
  tutor: string;
  apoyo: string;
  razon: string;
}

interface AIMatchResult {
  parejas: AIPair[];
  dinamica: string;
}

export default function MatchAprendizajePage() {
  const datos = useDIAStore((s) => s.datos);
  
  const asignaturas = useMemo(() => {
    if (!datos) return [];
    const set = new Set<AsignaturaAcademica>();
    datos.academicos.forEach(a => set.add(a.asignatura));
    return Array.from(set);
  }, [datos]);

  const cursos = useMemo(() => {
    if (!datos) return [];
    const set = new Set<string>();
    datos.academicos.forEach(a => set.add(a.curso));
    return Array.from(set).sort();
  }, [datos]);

  const periodos = useMemo(() => {
    if (!datos) return [];
    const set = new Set<Periodo>();
    datos.academicos.forEach(a => set.add(a.periodo));
    return Array.from(set);
  }, [datos]);

  const [selectedAsignatura, setSelectedAsignatura] = useState<AsignaturaAcademica | ''>(
    asignaturas.length > 0 ? asignaturas[0] : ''
  );
  const [selectedCurso, setSelectedCurso] = useState<string>(
    cursos.length > 0 ? cursos[0] : ''
  );
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | ''>(
    periodos.length > 0 ? periodos[periodos.length - 1] : ''
  );

  const ejesDisponibles = selectedAsignatura ? EJES_POR_ASIGNATURA[selectedAsignatura] || [] : [];
  const [selectedEje, setSelectedEje] = useState<string>(
    ejesDisponibles.length > 0 ? ejesDisponibles[0] : ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<AIMatchResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-select first axis when subject changes
  useMemo(() => {
    if (selectedAsignatura && EJES_POR_ASIGNATURA[selectedAsignatura]) {
      const ejes = EJES_POR_ASIGNATURA[selectedAsignatura];
      if (!ejes.includes(selectedEje)) {
        setSelectedEje(ejes[0]);
      }
    }
  }, [selectedAsignatura, selectedEje]);

  // Find the matching dataset
  const dataset = useMemo(() => {
    if (!datos || !selectedAsignatura || !selectedCurso || !selectedPeriodo) return null;
    return datos.academicos.find(
      (a) => a.asignatura === selectedAsignatura && a.curso === selectedCurso && a.periodo === selectedPeriodo
    );
  }, [datos, selectedAsignatura, selectedCurso, selectedPeriodo]);

  const estudiantesValidos = useMemo(() => {
    if (!dataset || !selectedEje || !dataset.estudiantes) return [];
    return dataset.estudiantes
      .filter((e) => e.resultadosPorEje && e.resultadosPorEje[selectedEje] !== undefined)
      .map(e => ({
        nombre: e.nombre,
        puntaje: e.resultadosPorEje![selectedEje]
      }));
  }, [dataset, selectedEje]);

  const handleGenerate = async () => {
    if (estudiantesValidos.length === 0) return alert('No hay estudiantes con puntajes en este eje.');

    setIsLoading(true);
    setMatchResult(null);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudiantes: estudiantesValidos,
          contexto: {
            curso: getCursoLabel(dataset!.curso),
            asignatura: dataset!.asignatura,
            eje: selectedEje
          }
        })
      });

      if (!res.ok) throw new Error('Error al generar el match inteligente');
      
      const data = await res.json();
      setMatchResult(data);
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al conectar con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (matchResult) {
      const textToCopy = `PAREJAS SUGERIDAS:\n` + matchResult.parejas.map(p => `- Tutor: ${p.tutor} | Apoyo: ${p.apoyo} (${p.razon})`).join('\n') + `\n\nDINÁMICA:\n${matchResult.dinamica}`;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!datos || datos.academicos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <Users className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Sin datos académicos</h2>
        <p className="text-[var(--color-text-secondary)] mt-2">Carga planillas Excel primero.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex flex-col min-h-full">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-display flex items-center gap-3">
          Match de Aprendizaje <span className="badge badge-purple">Impulsado por IA</span>
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          La IA evalúa los perfiles académicos de todo tu curso para armar parejas colaborativas estratégicas y diseñar una dinámica de tutoría especializada.
        </p>
      </div>

      {/* Selectors & Generate Panel */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end justify-between print:hidden">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-muted)]">Asignatura</label>
            <select
              value={selectedAsignatura}
              onChange={(e) => setSelectedAsignatura(e.target.value as AsignaturaAcademica)}
              className="input-field block w-40 text-sm"
            >
              {asignaturas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-muted)]">Curso</label>
            <select
              value={selectedCurso}
              onChange={(e) => setSelectedCurso(e.target.value)}
              className="input-field block w-32 text-sm"
            >
              {cursos.map((c) => <option key={c} value={c}>{getCursoLabel(c)}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-muted)]">Eje a Reforzar</label>
            <select
              value={selectedEje}
              onChange={(e) => setSelectedEje(e.target.value)}
              className="input-field block w-56 text-sm border-[var(--color-dia-blue)]"
            >
              {ejesDisponibles.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!dataset || estudiantesValidos.length === 0 || isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando Perfiles...</>
          ) : (
            <><Bot className="w-4 h-4 mr-2" /> Agrupar Curso con IA</>
          )}
        </button>
      </div>

      {/* Results */}
      {!dataset ? (
        <div className="glass-card p-12 text-center print:hidden">
          <AlertCircle className="w-8 h-8 text-[var(--color-dia-amber)] mx-auto mb-3" />
          <h3 className="font-medium text-[var(--color-text-primary)]">Sin datos para esta selección</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Prueba cambiando el curso o la asignatura.</p>
        </div>
      ) : (
        <div className="space-y-6 flex-1">
          {isLoading && (
            <div className="glass-card flex flex-col items-center justify-center p-16 text-[var(--color-text-secondary)] border-dashed print:hidden">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
              <p className="text-lg font-medium text-[var(--color-text-primary)]">Gemini está creando el Match ideal...</p>
              <p className="text-sm mt-2 opacity-75">Cruzando los perfiles de {estudiantesValidos.length} estudiantes y diseñando la dinámica.</p>
            </div>
          )}

          {!isLoading && matchResult && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Pairs List */}
              <div className="xl:col-span-1 space-y-4">
                <div className="flex items-center justify-between print:hidden">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-500" />
                    Parejas ({matchResult.parejas.length})
                  </h3>
                  <span className="badge badge-blue">Eje: {selectedEje}</span>
                </div>
                
                {/* Visual Header for Printing */}
                <div className="hidden print:block mb-4 border-b pb-4">
                  <h2 className="text-2xl font-bold">Listado de Tutorías entre Pares</h2>
                  <p className="text-sm">Curso: {getCursoLabel(dataset.curso)} | Asignatura: {dataset.asignatura} | Eje: {selectedEje}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {matchResult.parejas.map((pair, idx) => (
                    <div key={idx} className="glass-card p-4 relative overflow-hidden group border border-[var(--color-border)] hover:border-[var(--color-dia-blue)] transition-colors print:shadow-none print:border-b print:rounded-none">
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[var(--color-dia-green)] to-[var(--color-dia-red)] opacity-50 print:hidden" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-[10px] text-[var(--color-dia-green)] font-bold uppercase tracking-wider mb-0.5">Rol Tutor</p>
                          <p className="font-semibold text-[var(--color-text-primary)] leading-tight">{pair.tutor}</p>
                        </div>
                        <div className="px-2">
                          <ArrowRightLeft className="w-4 h-4 text-[var(--color-text-muted)] opacity-50" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-[10px] text-[var(--color-dia-red)] font-bold uppercase tracking-wider mb-0.5">Rol Apoyo</p>
                          <p className="font-semibold text-[var(--color-text-primary)] leading-tight">{pair.apoyo}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[var(--color-border)]/50">
                        <p className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-[var(--color-dia-blue)] shrink-0 mt-0.5" />
                          <span>{pair.razon}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Dynamic Activity */}
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between print:hidden">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[var(--color-dia-purple)]/10">
                      <Bot className="w-5 h-5 text-[var(--color-dia-purple)]" />
                    </div>
                    Pauta de Trabajo Compartido
                  </h3>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button 
                      onClick={handlePrint}
                      className="btn-outline text-sm shadow-sm hover:bg-[var(--color-bg-secondary)]"
                    >
                      🖨️ Imprimir
                    </button>
                    <button 
                      onClick={handleCopy}
                      className="btn-primary text-sm shadow-sm border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                    >
                      {copied ? <Check className="w-4 h-4 mr-2 text-[var(--color-dia-green)]" /> : <Copy className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />}
                      {copied ? '¡Copiado!' : 'Copiar Todo'}
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6 border border-[var(--color-border)] print:border-none print:shadow-none print:bg-transparent print:p-0">
                  <div className="text-sm text-[var(--color-text-primary)] prose prose-sm dark:prose-invert max-w-none prose-h1:text-xl prose-h1:text-[var(--color-dia-purple)] prose-h2:text-lg prose-h2:border-b prose-h2:pb-2 prose-h2:border-[var(--color-border)] prose-strong:text-[var(--color-text-primary)]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{matchResult.dinamica}</ReactMarkdown>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {!isLoading && !matchResult && estudiantesValidos.length > 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--color-bg-primary)]/50 border-2 border-dashed border-[var(--color-border)] rounded-xl print:hidden">
              <Users className="w-12 h-12 mb-4 opacity-50 text-[var(--color-text-muted)]" />
              <p className="font-medium text-[var(--color-text-primary)] mb-1">
                Listos para emparejar a {estudiantesValidos.length} estudiantes
              </p>
              <p className="text-sm max-w-sm text-[var(--color-text-secondary)]">
                Haz clic en "Agrupar Curso con IA" para que Gemini encuentre las mejores combinaciones pedagógicas para tu clase.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
