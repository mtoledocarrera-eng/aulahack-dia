'use client';

import { FileText, Copy, Bot, Check, UploadCloud, Loader2, HeartHandshake, ShieldAlert } from 'lucide-react';
import { useState, useRef } from 'react';

export default function ClimaSocioemocionalPage() {
  const [fileSocioemocional, setFileSocioemocional] = useState<File | null>(null);
  const [fileConvivencia, setFileConvivencia] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputSocioRef = useRef<HTMLInputElement>(null);
  const fileInputConvivenciaRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (generatedReport) {
      navigator.clipboard.writeText(generatedReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'socioemocional' | 'convivencia') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'socioemocional') setFileSocioemocional(e.target.files[0]);
      if (type === 'convivencia') setFileConvivencia(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: 'socioemocional' | 'convivencia') => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        if (type === 'socioemocional') setFileSocioemocional(droppedFile);
        if (type === 'convivencia') setFileConvivencia(droppedFile);
      } else {
        alert('Por favor, sube archivos en formato PDF.');
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
    if (!fileSocioemocional && !fileConvivencia) {
      return alert('Por favor sube al menos un PDF del DIA (Socioemocional o Convivencia).');
    }

    setIsLoading(true);
    setGeneratedReport(null);

    try {
      const pdfSocioemocionalBase64 = fileSocioemocional ? await fileToBase64(fileSocioemocional) : null;
      const pdfConvivenciaBase64 = fileConvivencia ? await fileToBase64(fileConvivencia) : null;

      const res = await fetch('/api/clima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfSocioemocionalBase64,
          pdfConvivenciaBase64,
        })
      });

      if (!res.ok) {
        throw new Error('Error al generar la radiografía');
      }

      const data = await res.json();
      setGeneratedReport(data.text);
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al conectar con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-display flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-[var(--color-dia-purple)]" />
          Radiografía Clima y Socioemocional
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Sube tus PDFs de Resultados del DIA (Aprendizaje Socioemocional y/o Convivencia Escolar) para recibir un diagnóstico del curso consolidado por IA.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Input */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-5">
            <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4" /> Carga de Informes DIA
            </h3>
            
            {/* File Upload drag and drop - Socioemocional */}
            <div 
              className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--color-dia-amber)] hover:bg-[var(--color-bg-secondary)] transition-all"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'socioemocional')}
              onClick={() => fileInputSocioRef.current?.click()}
            >
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputSocioRef}
                onChange={(e) => handleFileChange(e, 'socioemocional')}
              />
              <UploadCloud className="w-6 h-6 text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {fileSocioemocional ? fileSocioemocional.name : '1. PDF Socioemocional'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {fileSocioemocional ? 'Haz clic para cambiar' : '(Opcional pero recomendado)'}
              </p>
            </div>

            {/* File Upload drag and drop - Convivencia */}
            <div 
              className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--color-dia-amber)] hover:bg-[var(--color-bg-secondary)] transition-all"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'convivencia')}
              onClick={() => fileInputConvivenciaRef.current?.click()}
            >
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputConvivenciaRef}
                onChange={(e) => handleFileChange(e, 'convivencia')}
              />
              <UploadCloud className="w-6 h-6 text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {fileConvivencia ? fileConvivencia.name : '2. PDF Convivencia Escolar'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {fileConvivencia ? 'Haz clic para cambiar' : '(Opcional pero recomendado)'}
              </p>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={(!fileSocioemocional && !fileConvivencia) || isLoading}
              className="btn-primary w-full justify-center bg-[var(--color-dia-purple)] hover:bg-[var(--color-dia-purple)]/90 border-[var(--color-dia-purple)]/20"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando Clima de Aula...</>
              ) : (
                <><Bot className="w-4 h-4 mr-2" /> Generar Radiografía por IA</>
              )}
            </button>
          </div>

          <div className="glass-card p-5 bg-[var(--color-bg-secondary)] border-l-4 border-l-[var(--color-dia-amber)]">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--color-dia-amber)]" />
              ¿Qué analiza la IA?
            </h4>
            <ul className="text-xs text-[var(--color-text-secondary)] space-y-2 list-disc pl-4 text-justify">
              <li>Lee los cuadros de resultados estadísticos del PDF.</li>
              <li>Detecta emociones prevalentes (Enojo, Tristeza, Alegría).</li>
              <li>Identifica áreas críticas de convivencia (Bullying, Participación).</li>
              <li>Genera sugerencias prácticas para el Profesor Jefe.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: AI Output */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[var(--color-dia-purple)]/10">
                <Bot className="w-5 h-5 text-[var(--color-dia-purple)]" />
              </div>
              Radiografía del Curso Generada
            </h3>
            {generatedReport && (
              <button 
                onClick={handleCopy}
                className="btn-outline text-sm shadow-sm border-[var(--color-dia-purple)]/20 text-[var(--color-dia-purple)] hover:bg-[var(--color-dia-purple)]/10"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? '¡Copiado!' : 'Copiar Texto'}
              </button>
            )}
          </div>

          <div className="glass-card overflow-hidden border border-[var(--color-border)] min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text-secondary)]">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--color-dia-purple)]" />
                <p>Gemini está procesando las métricas de clima y socioemocionales...</p>
                <p className="text-xs mt-2 opacity-75">Puede tomar unos 10-15 segundos según el tamaño del curso.</p>
              </div>
            ) : generatedReport ? (
              <div className="p-6 text-sm text-[var(--color-text-primary)] prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap font-sans leading-relaxed text-justify">
                  {generatedReport}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text-muted)] text-center p-12">
                <HeartHandshake className="w-16 h-16 mb-4 opacity-20" />
                <h4 className="font-semibold text-lg text-[var(--color-text-primary)] mb-2">Sube tus diagnósticos institucionales</h4>
                <p className="text-sm">La inteligencia artificial cruzará la información de ambos instrumentos para darte una visión clara y directa de cómo se sienten tus estudiantes y cómo mejorar el ambiente de aprendizaje.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
