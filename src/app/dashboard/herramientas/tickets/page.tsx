'use client';

import { useDIAStore } from '@/lib/store/dia-store';
import { getCursoLabel, type AsignaturaAcademica, type Periodo } from '@/lib/types/dia';
import { FileText, Copy, Bot, Check, ArrowDownCircle, AlertCircle, Target, UploadCloud, Loader2 } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { saveAIHistory } from '@/lib/firebase/db';

// Si no tienes react-markdown instalado, lo usaremos como pre guardado o pedimos instalar. Asumiendo HTML simple por si acaso, o usaremos pre.
// Para este MVP mostraremos el texto preformateado.

export default function TicketsPage() {
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
  
  const [filePrueba, setFilePrueba] = useState<File | null>(null);
  const [fileResultados, setFileResultados] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const fileInputPruebaRef = useRef<HTMLInputElement>(null);
  const fileInputResultadosRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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
    return { ejeCritico };
  }, [dataset]);

  const handleCopy = () => {
    if (generatedTicket) {
      navigator.clipboard.writeText(generatedTicket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    }
  };

  const handlePrint = () => {
    // Basic window print - ideally coupled with CSS @media print
    window.print();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'prueba' | 'resultados') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'prueba') setFilePrueba(e.target.files[0]);
      if (type === 'resultados') setFileResultados(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: 'prueba' | 'resultados') => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        if (type === 'prueba') setFilePrueba(droppedFile);
        if (type === 'resultados') setFileResultados(droppedFile);
      } else {
        alert('Por favor, sube un archivo PDF.');
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!filePrueba) return alert('Por favor sube el PDF de la Evaluación.');
    if (!fileResultados) return alert('Por favor sube el PDF de los Resultados.');
    if (!analisisEjes || !dataset) return;

    setIsLoading(true);
    setGeneratedTicket(null);
    setGeneratedPrompt(null);

    try {
      const pdfPruebaBase64 = await fileToBase64(filePrueba);
      const pdfResultadosBase64 = await fileToBase64(fileResultados);

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfPruebaBase64,
          pdfResultadosBase64,
          contexto: {
            curso: getCursoLabel(dataset.curso),
            asignatura: dataset.asignatura,
            eje: analisisEjes.ejeCritico.eje,
            logro: analisisEjes.ejeCritico.porcentajeLogro
          }
        })
      });

      if (!res.ok) {
        throw new Error('Error al generar el ticket');
      }

      const data = await res.json();
      setGeneratedTicket(data.text);
      setGeneratedPrompt(data.prompt);

      if (user) {
        saveAIHistory(user.uid, 'tickets', data.text, {
          curso: getCursoLabel(dataset.curso),
          asignatura: dataset.asignatura,
          eje: analisisEjes.ejeCritico.eje,
          logro: analisisEjes.ejeCritico.porcentajeLogro
        }).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al conectar con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!datos || datos.academicos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <FileText className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Sin datos académicos</h2>
        <p className="text-[var(--color-text-secondary)] mt-2">Carga planillas Excel para generar tickets de salida basados en desempeño.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-display">
          Generador de Tickets de Salida con IA
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Sube el PDF de la prueba, indica la pregunta más descendida y Gemini creará una actividad remedial específica.
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
        <div className="glass-card p-12 text-center">
          <AlertCircle className="w-8 h-8 text-warning mx-auto mb-3" />
          <h3 className="font-medium text-[var(--color-text-primary)]">Sin datos para esta selección</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Prueba seleccionando otro curso o asignatura.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:block">
          
          {/* Left Column: Context & Input */}
          <div className="xl:col-span-1 space-y-6 print:hidden">
            <div className="glass-card p-6 border-t-4 border-t-[var(--color-dia-purple)]">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[var(--color-dia-purple)]" />
                <h3 className="font-semibold text-[var(--color-text-primary)]">Contexto del Curso</h3>
              </div>
              <p className="text-lg font-bold font-display text-[var(--color-text-primary)] leading-tight mb-2">
                Eje Crítico: {analisisEjes.ejeCritico.eje}
              </p>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <ArrowDownCircle className="w-4 h-4 text-[var(--color-dia-red)]" />
                <span>Rendimiento: <strong className="text-[var(--color-text-primary)]">{analisisEjes.ejeCritico.porcentajeLogro}%</strong></span>
              </div>
            </div>

            <div className="glass-card p-6 space-y-5">
              <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <FileText className="w-4 h-4" /> Configuración del Ticket
              </h3>
              
              {/* File Upload drag and drop - Prueba */}
              <div 
                className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--color-dia-blue)] hover:bg-[var(--color-bg-secondary)] transition-all"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'prueba')}
                onClick={() => fileInputPruebaRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  ref={fileInputPruebaRef}
                  onChange={(e) => handleFileChange(e, 'prueba')}
                />
                <UploadCloud className="w-6 h-6 text-[var(--color-text-muted)] mb-2" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {filePrueba ? filePrueba.name : '1. PDF de la Evaluación'}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {filePrueba ? 'Cambiar' : 'Arrastra o haz clic (.pdf)'}
                </p>
              </div>

              {/* File Upload drag and drop - Resultados */}
              <div 
                className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--color-dia-blue)] hover:bg-[var(--color-bg-secondary)] transition-all"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'resultados')}
                onClick={() => fileInputResultadosRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  ref={fileInputResultadosRef}
                  onChange={(e) => handleFileChange(e, 'resultados')}
                />
                <UploadCloud className="w-6 h-6 text-[var(--color-text-muted)] mb-2" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {fileResultados ? fileResultados.name : '2. PDF de Resultados (Curso)'}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {fileResultados ? 'Cambiar' : 'Arrastra o haz clic (.pdf)'}
                </p>
              </div>

              {/* Input for the question REMOVIDO para automatización */}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleGenerate}
                  disabled={!filePrueba || !fileResultados || isLoading}
                  className="btn-primary w-full justify-center"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando PDF...</>
                  ) : (
                    <><Bot className="w-4 h-4 mr-2" /> Generar Ticket con IA</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Output */}
          <div className="xl:col-span-2 space-y-4 print:w-full">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-brand-500/10">
                  <Bot className="w-5 h-5 text-brand-500" />
                </div>
                Ticket de Salida Generado
              </h3>
              {generatedTicket && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {generatedPrompt && (
                    <button 
                      onClick={handleCopyPrompt}
                      className="btn-outline text-sm shadow-sm border-dashed hover:bg-[var(--color-bg-secondary)]"
                    >
                      {copiedPrompt ? <Check className="w-4 h-4 mr-2 text-[var(--color-dia-green)]" /> : <Bot className="w-4 h-4 mr-2" />}
                      {copiedPrompt ? '¡Prompt Copiado!' : 'Copiar Prompt para otra IA'}
                    </button>
                  )}
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
                    {copied ? '¡Copiado!' : 'Copiar Texto'}
                  </button>
                </div>
              )}
            </div>

            <div className="glass-card overflow-hidden border border-[var(--color-border)] min-h-[400px] print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text-secondary)]">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--color-dia-blue)]" />
                  <p>Gemini está leyendo la prueba e ideando el remedial...</p>
                  <p className="text-xs mt-2 opacity-75">Esto puede tardar unos segundos</p>
                </div>
              ) : generatedTicket ? (
                <div className="p-6 text-sm text-[var(--color-text-primary)] prose prose-sm dark:prose-invert max-w-none">
                  {/* Para el MVP, mostramos texto con formato basico preservando saltos de linea */}
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">
                    {generatedTicket}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text-muted)] text-center p-8">
                  <Bot className="w-12 h-12 mb-4 opacity-50" />
                  <p>Sube tu PDF y señala la pregunta fallida.</p>
                  <p className="text-xs mt-2">La IA leerá el distractor original y creará un ejercicio nuevo para corregir la confusión.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
