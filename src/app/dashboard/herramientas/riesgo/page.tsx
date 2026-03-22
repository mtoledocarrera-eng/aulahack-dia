'use client';

import { useDIAStore } from '@/lib/store/dia-store';
import { getCursoLabel, type NivelLogro, type Periodo } from '@/lib/types/dia';
import { AlertTriangle, ShieldAlert, Activity, Filter, Eye, X, Loader2, Copy, Check, Bot } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/lib/contexts/AuthContext';
import { saveAIHistory } from '@/lib/firebase/db';

type NivelRiesgo = 'Crítico' | 'Alto' | 'Medio' | 'Bajo';

interface ResultadoAsignatura {
  asignatura: string;
  nivel: NivelLogro;
  puntaje: number;
}

interface PerfilRiesgoEstudiante {
  id: string;
  nombre: string;
  asignaturasEvaluadas: number;
  asignaturasNivelI: string[];
  promedioGeneral: number;
  nivelRiesgo: NivelRiesgo;
  motivoRiesgo: string;
  resultados: ResultadoAsignatura[];
}

export default function RiesgoPage() {
  const datos = useDIAStore((s) => s.datos);
  
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

  const [selectedCurso, setSelectedCurso] = useState<string>(cursos.length > 0 ? cursos[0] : '');
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | ''>(periodos.length > 0 ? periodos[periodos.length - 1] : '');
  const [filterRiesgo, setFilterRiesgo] = useState<NivelRiesgo | 'Todos'>('Todos');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStudent, setDrawerStudent] = useState<PerfilRiesgoEstudiante | null>(null);
  const [fichaContent, setFichaContent] = useState<string>('');
  const [fichaLoading, setFichaLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  // Algorithm: Consolidate students across all subjects
  const perfilesRiesgo = useMemo(() => {
    if (!datos || !selectedCurso || !selectedPeriodo) return [];

    const datasets = datos.academicos.filter(
      (a) => a.curso === selectedCurso && a.periodo === selectedPeriodo
    );

    if (datasets.length === 0) return [];

    const studentMap = new Map<string, {
      nombre: string;
      resultados: ResultadoAsignatura[];
    }>();

    for (const ds of datasets) {
      for (const st of ds.estudiantes) {
        if (!studentMap.has(st.nombre)) {
          studentMap.set(st.nombre, { nombre: st.nombre, resultados: [] });
        }
        studentMap.get(st.nombre)!.resultados.push({
          asignatura: ds.asignatura,
          nivel: st.nivelLogro,
          puntaje: st.puntaje || 0,
        });
      }
    }

    const perfiles: PerfilRiesgoEstudiante[] = [];

    for (const [nombre, data] of studentMap.entries()) {
      const asignaturasNivelI = data.resultados.filter(r => r.nivel === 'I').map(r => r.asignatura);
      const asignaturasEvaluadas = data.resultados.length;
      
      let sumPuntaje = 0;
      data.resultados.forEach(r => sumPuntaje += r.puntaje);
      const promedioGeneral = asignaturasEvaluadas > 0 ? Math.round(sumPuntaje / asignaturasEvaluadas) : 0;

      let nivelRiesgo: NivelRiesgo = 'Bajo';
      let motivoRiesgo = 'Sin riesgo evidente';

      if (asignaturasNivelI.length === asignaturasEvaluadas && asignaturasEvaluadas >= 2) {
        nivelRiesgo = 'Crítico';
        motivoRiesgo = 'Nivel I en todas las asignaturas evaluadas';
      } else if (asignaturasNivelI.includes('Lectura') && asignaturasNivelI.includes('Matemática')) {
        nivelRiesgo = 'Alto';
        motivoRiesgo = 'Nivel I simultáneo en Lectura y Matemática';
      } else if (promedioGeneral < 40) {
        nivelRiesgo = 'Alto';
        motivoRiesgo = 'Promedio general muy bajo (' + promedioGeneral + '%)';
      } else if (asignaturasNivelI.length >= 2) {
        nivelRiesgo = 'Medio';
        motivoRiesgo = 'Nivel I en ' + asignaturasNivelI.length + ' asignaturas';
      } else if (asignaturasNivelI.length === 1) {
        nivelRiesgo = 'Bajo';
        motivoRiesgo = 'Nivel descendido solo en ' + asignaturasNivelI[0];
      }

      perfiles.push({
        id: nombre,
        nombre,
        asignaturasEvaluadas,
        asignaturasNivelI,
        promedioGeneral,
        nivelRiesgo,
        motivoRiesgo,
        resultados: data.resultados,
      });
    }

    const riskWeight = { 'Crítico': 4, 'Alto': 3, 'Medio': 2, 'Bajo': 1 };
    perfiles.sort((a, b) => riskWeight[b.nivelRiesgo] - riskWeight[a.nivelRiesgo] || a.nombre.localeCompare(b.nombre));

    return perfiles;
  }, [datos, selectedCurso, selectedPeriodo]);

  const displayedProfiles = useMemo(() => {
    if (filterRiesgo === 'Todos') return perfilesRiesgo.filter(p => p.nivelRiesgo !== 'Bajo');
    return perfilesRiesgo.filter(p => p.nivelRiesgo === filterRiesgo);
  }, [perfilesRiesgo, filterRiesgo]);

  const riskCounts = useMemo(() => {
    const counts = { Crítico: 0, Alto: 0, Medio: 0, Bajo: 0 };
    perfilesRiesgo.forEach(p => counts[p.nivelRiesgo]++);
    return counts;
  }, [perfilesRiesgo]);

  const handleVerFicha = useCallback(async (perfil: PerfilRiesgoEstudiante) => {
    setDrawerStudent(perfil);
    setDrawerOpen(true);
    setFichaContent('');
    setFichaLoading(true);
    setCopied(false);

    try {
      const res = await fetch('/api/riesgo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: perfil.nombre,
          curso: getCursoLabel(selectedCurso),
          nivelRiesgo: perfil.nivelRiesgo,
          promedioGeneral: perfil.promedioGeneral,
          resultados: perfil.resultados,
        })
      });

      if (!res.ok) throw new Error('Error al generar la ficha');
      const data = await res.json();
      setFichaContent(data.ficha);

      if (user) {
        saveAIHistory(user.uid, 'riesgo', data.ficha, {
          estudiante: perfil.nombre,
          curso: getCursoLabel(selectedCurso),
          nivelRiesgo: perfil.nivelRiesgo,
          promedioGeneral: perfil.promedioGeneral
        }).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      setFichaContent('⚠️ Error al generar la ficha. Intenta nuevamente.');
    } finally {
      setFichaLoading(false);
    }
  }, [selectedCurso]);

  const handleCopyFicha = () => {
    if (fichaContent) {
      navigator.clipboard.writeText(fichaContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintFicha = () => {
    window.print();
  };

  if (!datos || datos.academicos.length === 0) {
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-6 shadow-neon">
          <AlertTriangle className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Sin datos académicos
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-sm font-medium">
          Carga planillas Excel para analizar los perfiles de riesgo individual.
        </p>
      </div>
  }

  const getRiskBadgeClass = (riesgo: NivelRiesgo) => {
    switch (riesgo) {
      case 'Crítico': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'Alto': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case 'Medio': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Bajo': return 'bg-green-500/10 text-green-500 border border-green-500/20';
    }
  };

  const getRiskAccentColor = (riesgo: NivelRiesgo) => {
    switch (riesgo) {
      case 'Crítico': return '#ef4444'; // Red
      case 'Alto': return '#f97316';    // Orange/Neon
      case 'Medio': return '#f59e0b';   // Amber
      case 'Bajo': return '#10b981';    // Emerald/Success
    }
  };

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-display flex items-center gap-3">
          Matriz de Riesgo Individual <span className="badge badge-red">Alerta Temprana</span>
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Detección temprana de estudiantes con desempeño descendido. Haz clic en "Ver Ficha" para un diagnóstico personalizado con IA.
        </p>
      </div>

      {/* Selectors & Filters */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end justify-between print:hidden">
        <div className="flex gap-4">
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
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)] p-1 bg-[var(--color-bg-secondary)]">
            <button 
              onClick={() => setFilterRiesgo('Todos')}
              className={"px-3 py-1 text-xs font-medium rounded-md transition-colors " + (filterRiesgo === 'Todos' ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]')}
            >
              Con Riesgo
            </button>
            <button 
              onClick={() => setFilterRiesgo('Crítico')}
              className={"px-3 py-1 text-xs font-medium rounded-md transition-colors " + (filterRiesgo === 'Crítico' ? 'bg-red-500/20 text-red-500 shadow-sm' : 'text-[var(--color-text-muted)] hover:text-red-400')}
            >
              Críticos ({riskCounts['Crítico']})
            </button>
            <button 
              onClick={() => setFilterRiesgo('Alto')}
              className={"px-3 py-1 text-xs font-medium rounded-md transition-colors " + (filterRiesgo === 'Alto' ? 'bg-orange-500/20 text-orange-500 shadow-sm' : 'text-[var(--color-text-muted)] hover:text-orange-400')}
            >
              Altos ({riskCounts['Alto']})
            </button>
            <button 
              onClick={() => setFilterRiesgo('Medio')}
              className={"px-3 py-1 text-xs font-medium rounded-md transition-colors " + (filterRiesgo === 'Medio' ? 'bg-amber-500/20 text-amber-500 shadow-sm' : 'text-[var(--color-text-muted)] hover:text-amber-400')}
            >
              Medios ({riskCounts['Medio']})
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      {perfilesRiesgo.length === 0 ? (
        <div className="glass-card p-12 text-center print:hidden">
          <Activity className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-medium text-[var(--color-text-primary)]">Sin datos cruzados suficientes</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Asegúrate de cargar los resultados de múltiples asignaturas para este curso.</p>
        </div>
      ) : (
        <div className="space-y-4 print:hidden">
          {displayedProfiles.length === 0 ? (
            <div className="glass-card p-8 text-center text-[var(--color-text-secondary)] italic">
              No hay estudiantes en el nivel de riesgo seleccionado.
            </div>
          ) : (
            displayedProfiles.map((perfil) => (
              <div key={perfil.id} className="glass-card p-5 hover:bg-[var(--color-bg-secondary)] transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-[var(--color-text-primary)] text-lg truncate">
                      {perfil.nombre}
                    </h3>
                    <span className={"px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider " + getRiskBadgeClass(perfil.nivelRiesgo)}>
                      Riesgo {perfil.nivelRiesgo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{perfil.motivoRiesgo}</span>
                  </div>
                </div>

                {/* Vertical Divider (desktop) */}
                <div className="hidden md:block w-px h-12 bg-[var(--color-border)] opacity-50 mx-4"></div>

                {/* Stats */}
                <div className="flex gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Prom. General</p>
                    <p className="font-mono font-medium text-[var(--color-text-primary)] text-lg">
                      {perfil.promedioGeneral}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Evaluaciones</p>
                    <p className="font-mono font-medium text-[var(--color-text-primary)] text-lg">
                      {perfil.asignaturasEvaluadas}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Áreas Críticas</p>
                    <div className="flex gap-1">
                      {perfil.asignaturasNivelI.length > 0 ? (
                        perfil.asignaturasNivelI.map(asig => (
                          <span key={asig} className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-xs border border-red-500/10" title={asig}>
                            {asig.substring(0, 3).toUpperCase()}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">-</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action */}
                <div className="w-full md:w-auto pt-4 md:pt-0 mt-4 md:mt-0 border-t border-[var(--color-border)] md:border-0 pl-0 md:pl-4">
                  <button 
                    onClick={() => handleVerFicha(perfil)}
                    className="btn-primary w-full md:w-auto text-sm"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Ver Ficha IA
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ====== AI DRAWER / SLIDE PANEL ====== */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 print:hidden"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] xl:w-[700px] bg-[var(--color-bg-primary)] border-l border-[var(--color-border)] shadow-2xl z-50 flex flex-col overflow-hidden print:static print:w-full print:h-auto print:border-none print:shadow-none">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] shrink-0 print:border-b-2 print:border-black">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: getRiskAccentColor(drawerStudent?.nivelRiesgo || 'Bajo') }}
                >
                  {drawerStudent?.nombre?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-[var(--color-text-primary)] text-lg truncate">
                    {drawerStudent?.nombre}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider " + getRiskBadgeClass(drawerStudent?.nivelRiesgo || 'Bajo')}>
                      Riesgo {drawerStudent?.nivelRiesgo}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Prom: {drawerStudent?.promedioGeneral}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 print:hidden">
                {fichaContent && !fichaLoading && (
                  <>
                    <button 
                      onClick={handlePrintFicha}
                      className="btn-outline text-sm"
                    >
                      🖨️
                    </button>
                    <button 
                      onClick={handleCopyFicha}
                      className="btn-outline text-sm"
                    >
                      {copied ? <Check className="w-4 h-4 text-[var(--color-dia-green)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {fichaLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Generando Ficha Clínica...</p>
                  <p className="text-sm mt-1 font-medium opacity-75">El Orientador IA está analizando el perfil de {drawerStudent?.nombre}</p>
                </div>
              ) : (
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 [&>p]:mb-4 [&>h1]:text-brand-500 [&>h1]:text-xl [&>h1]:font-bold [&>h2]:text-brand-500 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:border-b [&>h2]:pb-2 [&>h2]:border-slate-200 dark:[&>h2]:border-slate-800 [&>h3]:text-brand-400 [&>h3]:font-semibold [&>strong]:font-bold [&>strong]:text-slate-900 dark:[&>strong]:text-white [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:mb-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{fichaContent}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
