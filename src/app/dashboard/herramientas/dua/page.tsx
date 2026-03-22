'use client';

import { useDIAStore } from '@/lib/store/dia-store';
import { getCursoLabel, type AsignaturaAcademica, type Periodo } from '@/lib/types/dia';
import { BookOpen, AlertCircle, ArrowDownCircle, Loader2, Bot, Copy, Check, Upload, FileType2, Printer } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/lib/contexts/AuthContext';
import { saveAIHistory } from '@/lib/firebase/db';

export default function DuaPage() {
  const datos = useDIAStore((s) => s.datos);
  
  const asignaturas = useMemo(() => {
    if (!datos) return [];
    return Array.from(new Set(datos.academicos.map(a => a.asignatura)));
  }, [datos]);

  const cursos = useMemo(() => {
    if (!datos) return [];
    return Array.from(new Set(datos.academicos.map(a => a.curso))).sort();
  }, [datos]);

  const periodos = useMemo(() => {
    if (!datos) return [];
    return Array.from(new Set(datos.academicos.map(a => a.periodo)));
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

  const [objetivo, setObjetivo] = useState('');
  const [filePlanificacion, setFilePlanificacion] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDUA, setGeneratedDUA] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataset = useMemo(() => {
    if (!datos || !selectedAsignatura || !selectedCurso || !selectedPeriodo) return null;
    return datos.academicos.find(
      (a) => a.asignatura === selectedAsignatura && a.curso === selectedCurso && a.periodo === selectedPeriodo
    );
  }, [datos, selectedAsignatura, selectedCurso, selectedPeriodo]);

  const analisisEjes = useMemo(() => {
    if (!dataset || !dataset.resultadosPorEje || dataset.resultadosPorEje.length === 0) return null;
    const sortedEjes = [...dataset.resultadosPorEje].sort((a, b) => a.porcentajeLogro - b.porcentajeLogro);
    const ejeCritico = sortedEjes[0];
    return { ejeCritico, todosLosEjes: sortedEjes };
  }, [dataset]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFilePlanificacion(droppedFile);
      } else {
        alert('Por favor, sube un archivo PDF.');
      }
    }
  };

  const handleGenerate = async () => {
    if (!objetivo.trim() && !filePlanificacion) {
      return alert('Por favor escribe el objetivo de la clase o sube un PDF con tu planificación.');
    }
    if (!analisisEjes || !dataset) return;

    setIsLoading(true);
    setGeneratedDUA(null);

    try {
      let pdfBase64 = null;
      if (filePlanificacion) {
        pdfBase64 = await fileToBase64(filePlanificacion);
      }

      const res = await fetch('/api/dua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objetivo,
          pdfPlanificacionBase64: pdfBase64,
          contexto: {
            curso: getCursoLabel(dataset.curso),
            asignatura: dataset.asignatura,
            ejeCritico: analisisEjes.ejeCritico.eje,
            logroEje: analisisEjes.ejeCritico.porcentajeLogro
          }
        })
      });

      if (!res.ok) throw new Error('Error al generar las estrategias');
      const data = await res.json();
      setGeneratedDUA(data.text);

      if (user) {
        saveAIHistory(user.uid, 'dua', data.text, {
          asignatura: dataset.asignatura,
          curso: getCursoLabel(dataset.curso),
          objetivo: objetivo || 'Sin especificar'
        }).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al conectar con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedDUA) {
      navigator.clipboard.writeText(generatedDUA);
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
        <BookOpen className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Sin datos académicos</h2>
        <p className="text-[var(--color-text-secondary)] mt-2">Carga planillas Excel para generar estrategias DUA.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex flex-col min-h-full">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-display">
          Generador de Estrategias DUA con IA
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Cruza los datos académicos de tu curso con el objetivo de tu próxima clase para obtener adaptaciones DUA ultra-personalizadas.
        </p>
      </div>

      {/* Selectors */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end print:hidden">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Asignatura</label>
          <select
            value={selectedAsignatura}
            onChange={(e) => setSelectedAsignatura(e.target.value as AsignaturaAcademica)}
            className="input-field block w-48 text-sm"
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
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Período</label>
          <select
            value={selectedPeriodo}
            onChange={(e) => setSelectedPeriodo(e.target.value as Periodo)}
            className="input-field block w-40 text-sm"
          >
            {periodos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {!dataset || !analisisEjes ? (
        <div className="glass-card p-12 text-center print:hidden">
          <AlertCircle className="w-8 h-8 text-warning mx-auto mb-3" />
          <h3 className="font-medium text-[var(--color-text-primary)]">Sin datos para esta selección</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Prueba seleccionando otro curso o asignatura.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 print:block">
          
          {/* Left Column: Context & Input */}
          <div className="xl:col-span-1 space-y-6 print:hidden">
            {/* Context Widget */}
            <div className="glass-card p-6 border-t-4 border-t-[var(--color-dia-red)]">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownCircle className="w-5 h-5 text-[var(--color-dia-red)]" />
                <h3 className="font-semibold text-[var(--color-text-primary)]">Debilidad del Curso</h3>
              </div>
              <p className="text-lg font-bold font-display text-[var(--color-text-primary)] leading-tight mb-2">
                Eje Crítico: {analisisEjes.ejeCritico.eje}
              </p>
              <div className="flex items-end gap-2 text-[var(--color-dia-red)]">
                <span className="text-3xl font-black">{analisisEjes.ejeCritico.porcentajeLogro}%</span>
                <span className="text-sm font-medium pb-1">de logro curso</span>
              </div>
              <p className="text-xs mt-3 text-[var(--color-text-secondary)] leading-relaxed">
                Gemini tomará automáticamente esta debilidad para sugerirte cómo cubrir tu clase adaptando este concepto.
              </p>
            </div>

            {/* User Input Form */}
            <div className="glass-card p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <h3 className="text-[var(--color-text-primary)] font-semibold mb-4 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-500" /> Ingresa la próxima clase
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">
                    Objetivo de Aprendizaje o Tema (Opcional)
                  </label>
                  <textarea
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    placeholder="Ej: Comprender las fracciones impropias..."
                    className="input-field w-full min-h-[80px] text-sm resize-none"
                  />
                </div>

                <div 
                  className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                    filePlanificacion ? 'border-brand-500 bg-brand-500/5' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFilePlanificacion(e.target.files[0]);
                      }
                    }}
                    accept=".pdf"
                    className="hidden"
                  />
                  
                  {filePlanificacion ? (
                    <div className="flex flex-col items-center">
                      <FileType2 className="w-8 h-8 text-[var(--color-dia-blue)] mb-2" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                        {filePlanificacion.name}
                      </p>
                      <button 
                        onClick={() => setFilePlanificacion(null)}
                        className="text-xs text-[var(--color-dia-red)] hover:underline mt-2"
                      >
                        Eliminar PDF
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="p-2 rounded-full bg-[var(--color-bg-primary)] mb-3 shadow-sm border border-[var(--color-border)]">
                        <Upload className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        Planificación / Guía (Opcional)
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Sube PDF para que la IA lo adapte
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <button 
                    onClick={handleGenerate}
                    disabled={(!objetivo.trim() && !filePlanificacion) || isLoading}
                    className="btn-primary w-full justify-center"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando DUA...</>
                    ) : (
                      <><Bot className="w-4 h-4 mr-2" /> Generar Adaptaciones con IA</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Output */}
          <div className="xl:col-span-2 space-y-4 print:w-full">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[var(--color-dia-purple)]/10">
                  <Bot className="w-5 h-5 text-[var(--color-dia-purple)]" />
                </div>
                Propuesta DUA
              </h3>
              {generatedDUA && (
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
                    {copied ? <Check className="w-4 h-4 mr-2 text-success" /> : <Copy className="w-4 h-4 mr-2 text-slate-400" />}
                    {copied ? '¡Copiado!' : 'Copiar Texto'}
                  </button>
                </div>
              )}
            </div>

            <div className="glass-card overflow-hidden border border-[var(--color-border)] min-h-[400px] print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0 flex flex-col">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text-secondary)]">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--color-dia-purple)]" />
                  <p>Gemini está analizando la debilidad del curso y tu clase...</p>
                  <p className="text-xs mt-2 opacity-75">Configurando las 3 redes del DUA...</p>
                </div>
              ) : generatedDUA ? (
                <div className="p-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 [&>p]:mb-4 [&>h1]:text-brand-500 [&>h1]:text-xl [&>h1]:font-bold [&>h2]:text-brand-500 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:border-b [&>h2]:pb-2 [&>h2]:border-slate-200 dark:[&>h2]:border-slate-800 [&>h3]:text-[var(--color-success)] [&>h3]:font-semibold [&>strong]:font-bold [&>strong]:text-slate-900 dark:[&>strong]:text-white [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:mb-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedDUA}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text-muted)] px-8 text-center bg-[var(--color-bg-primary)]/50 border-2 border-dashed border-[var(--color-border)] m-6 rounded-xl">
                  <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium text-[var(--color-text-primary)] mb-1">
                    Describe la clase que vas a enseñar
                  </p>
                  <p className="text-sm max-w-sm">
                    Ingresa el objetivo o sube el PDF de tu próxima actividad. La IA cruzará el punto débil de tus alumnos con tu clase para crear adaptaciones específicas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
