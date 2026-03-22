'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { parseMultipleFiles } from '@/lib/parsers/excel-parser';
import { useDIAStore } from '@/lib/store/dia-store';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [parsedCount, setParsedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addAcademicos = useDIAStore((s) => s.addAcademicos);
  const setLoading = useDIAStore((s) => s.setLoading);
  const syncToCloud = useDIAStore((s) => s.syncToCloud);
  const { user } = useAuth();

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const excelFiles = newFiles.filter(
      (f) => f.name.endsWith('.xls') || f.name.endsWith('.xlsx')
    );

    if (excelFiles.length === 0) {
      setStatus('error');
      setMessage('No se encontraron archivos Excel (.xls o .xlsx)');
      return;
    }

    setFiles((prev) => [...prev, ...excelFiles]);
    setStatus('loading');
    setMessage(`Procesando ${excelFiles.length} archivo(s)...`);
    setLoading(true);

    try {
      const results = await parseMultipleFiles(excelFiles);
      if (results.length > 0) {
        addAcademicos(results);
        
        // Sync to cloud in the background if user is authenticated
        if (user) {
          syncToCloud(user.uid).catch(console.error);
        }

        setParsedCount((prev) => prev + results.length);
        setStatus('success');
        setMessage(
          `${results.length} archivo(s) procesado(s) correctamente. ` +
          `Total estudiantes: ${results.reduce((a, r) => a + r.totalEvaluados, 0)}`
        );
      } else {
        setStatus('error');
        setMessage('No se pudieron parsear los archivos. Verifica el formato.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(`Error al procesar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, [addAcademicos, setLoading]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [handleFiles]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  }, [handleFiles]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Dropzone */}
      <div
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xls,.xlsx"
          onChange={onFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {status === 'loading' ? (
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
          ) : (
            <div className={`p-4 rounded-full ${isDragging ? 'bg-[rgba(20,184,166,0.15)]' : 'bg-slate-100 dark:bg-slate-800'} transition-colors`}>
              <Upload className="w-8 h-8 text-brand-500" />
            </div>
          )}

          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {status === 'loading' ? 'Procesando archivos...' : 'Arrastra tus planillas Excel aquí'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
              o haz clic para seleccionar archivos .xls / .xlsx del DIA
            </p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {status !== 'idle' && (
        <div
          className={`mt-4 p-4 rounded-xl flex items-start gap-3 animate-fade-in ${
            status === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
              : status === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
          }`}
        >
          {status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />}
          {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />}
          {status === 'loading' && <Loader2 className="w-5 h-5 text-brand-500 mt-0.5 shrink-0 animate-spin" />}
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{message}</p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2 stagger-children">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex-1">
                {file.name}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Parsed count badge */}
      {parsedCount > 0 && (
        <div className="mt-4 text-center">
          <span className="badge badge-green">
            {parsedCount} curso(s) cargado(s) al sistema
          </span>
        </div>
      )}
    </div>
  );
}
