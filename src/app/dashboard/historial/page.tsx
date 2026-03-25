'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAIHistory, loadDatasetFromCloud, deleteAcademicEvaluation } from '@/lib/firebase/db';
import { Archive, Bot, ShieldAlert, FileText, Loader2, Clock } from 'lucide-react';

export default function HistorialPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [historiaDua, setHistoriaDua] = useState<any[]>([]);
  const [historiaRiesgo, setHistoriaRiesgo] = useState<any[]>([]);
  const [historiaTickets, setHistoriaTickets] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dua' | 'riesgo' | 'tickets' | 'datos'>('dua');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dua, riesgo, tickets, dataset] = await Promise.all([
          getAIHistory(user.uid, 'dua'),
          getAIHistory(user.uid, 'riesgo'),
          getAIHistory(user.uid, 'tickets'),
          loadDatasetFromCloud(user.uid)
        ]);
        setHistoriaDua(dua);
        setHistoriaRiesgo(riesgo);
        setHistoriaTickets(tickets);
        setDatasets(dataset?.academicos || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDeleteEvaluation = async (item: any) => {
    if (!user) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar la evaluación de ${item.asignatura} - ${item.curso}? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteAcademicEvaluation(user.uid, {
        asignatura: item.asignatura,
        curso: item.curso,
        periodo: item.periodo
      });
      // Refresh list
      setDatasets(prev => prev.filter(a => 
        !(a.asignatura === item.asignatura && a.curso === item.curso && a.periodo === item.periodo)
      ));
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      alert('Error al eliminar la evaluación.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha desconocida';
    return new Date(dateStr).toLocaleString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
          Mi Historial y Archivos <Archive className="w-8 h-8 text-brand-500" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Tus estrategias pedagógicas de AulaHack guardadas de forma segura en la nube.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-[var(--color-text-secondary)]">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
          <p>Cargando tu perfil desde la nube...</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Tabs Sidebar */}
          <div className="w-full lg:w-64 glass-card p-4 flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('dua')}
              className={`text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors font-medium border ${
                activeTab === 'dua' 
                  ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-800' 
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" /> DUA
              </div>
              <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{historiaDua.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('riesgo')}
              className={`text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors font-medium border ${
                activeTab === 'riesgo' 
                  ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800' 
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Casos Clínicos
              </div>
              <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{historiaRiesgo.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors font-medium border ${
                activeTab === 'tickets' 
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800' 
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> Tickets Salida
              </div>
              <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{historiaTickets.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('datos')}
              className={`text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors font-medium border ${
                activeTab === 'datos' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' 
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" /> Datos Académicos
              </div>
              <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{datasets.length}</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full space-y-6">
            {activeTab === 'dua' && (
              historiaDua.length === 0 ? (
                <EmptyState icon={<Bot />} text="Aún no has generado estrategias DUA." />
              ) : (
                historiaDua.map((item) => (
                  <HistoryItem key={item.id} item={item} title={`Estrategia DUA: ${item.curso} - ${item.asignatura}`} subtitle={`Objetivo: ${item.objetivo}`} />
                ))
              )
            )}
            
            {activeTab === 'riesgo' && (
              historiaRiesgo.length === 0 ? (
                <EmptyState icon={<ShieldAlert />} text="Aún no has analizado alumnos en riesgo." />
              ) : (
                historiaRiesgo.map((item) => (
                  <HistoryItem key={item.id} item={item} title={`Ficha Preventiva: ${item.estudiante}`} subtitle={`${item.curso} | Promedio: ${item.promedioGeneral}% | Riesgo ${item.nivelRiesgo}`} isAlert />
                ))
              )
            )}

            {activeTab === 'tickets' && (
              historiaTickets.length === 0 ? (
                <EmptyState icon={<FileText />} text="Aún no has creado tickets de salida interactivos." />
              ) : (
                historiaTickets.map((item) => (
                  <HistoryItem key={item.id} item={item} title={`Ticket Remedial: ${item.curso} - ${item.asignatura}`} subtitle={`Eje Débil: ${item.eje} (${item.logro}% logro)`} />
                ))
              )
            )}

            {activeTab === 'datos' && (
              datasets.length === 0 ? (
                <EmptyState icon={<Archive />} text="No hay bases de datos académicas cargadas." />
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">
                    <p className="font-bold flex items-center gap-2 mb-1">
                      <Archive className="w-4 h-4" /> Gestión de Datos
                    </p>
                    Aquí puedes ver y eliminar los archivos Excel que has procesado. Esto actualizará el análisis global de tu curso.
                  </div>
                  {datasets.map((item, idx) => (
                    <div key={`${item.asignatura}-${item.curso}-${idx}`} className="glass-card p-5 flex items-center justify-between gap-4 border-l-4 border-emerald-500 hover:shadow-lg transition-all">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{item.asignatura}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                             {item.curso}
                          </span>
                          <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 capitalize">
                             {item.periodo}
                          </span>
                          <span className="text-xs text-slate-400">
                            {item.totalEvaluados} estudiantes
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteEvaluation(item)}
                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors group"
                        title="Eliminar esta evaluación"
                      >
                        <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

}

function EmptyState({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center p-12 text-center text-[var(--color-text-muted)] border-dashed border-2">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 opacity-50">
        {icon}
      </div>
      <p className="font-medium text-lg text-[var(--color-text-secondary)]">{text}</p>
      <p className="text-sm mt-1">Ve a la herramienta correspondiente en el menú para crear una.</p>
    </div>
  );
}

function HistoryItem({ item, title, subtitle, isAlert = false }: { item: any, title: string, subtitle: string, isAlert?: boolean }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha desconocida';
    return new Date(dateStr).toLocaleString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className={`glass-card p-6 border-l-4 ${isAlert ? 'border-l-orange-500' : 'border-l-brand-500'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">{subtitle}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(item.createdAt)}
        </div>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {item.content}
      </div>
    </div>
  );
}
