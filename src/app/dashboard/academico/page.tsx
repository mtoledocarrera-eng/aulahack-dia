'use client';

import { useDIAStore } from '@/lib/store/dia-store';
import { getCursoLabel, getAsignaturaShort, PERIODOS_LABELS, NIVEL_LOGRO_COLORS } from '@/lib/types/dia';
import type { AsignaturaAcademica, Periodo, NivelLogro, ResultadoCursoAcademico } from '@/lib/types/dia';
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Filter,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useMemo, useState } from 'react';

// ============================================
// KPI Card Component
// ============================================

function KPICard({
  label,
  value,
  subvalue,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subvalue?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="glass-card p-6 flex items-start justify-between group">
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
          {label}
        </p>
        <p className="text-3xl font-black mt-1 tracking-tight" style={{ color }}>
          {value}
        </p>
        {subvalue && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{subvalue}</p>
        )}
      </div>
      <div className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: `${color}15`, boxShadow: `0 0 20px ${color}10` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
  );
}

// ============================================
// Academic Dashboard Page
// ============================================

export default function AcademicDashboard() {
  const datos = useDIAStore((s) => s.datos);
  const filters = useDIAStore((s) => s.filters);
  const setFilters = useDIAStore((s) => s.setFilters);
  const getAcademicosFiltrados = useDIAStore((s) => s.getAcademicosFiltrados);
  const getCursosDisponibles = useDIAStore((s) => s.getCursosDisponibles);
  const getAsignaturasDisponibles = useDIAStore((s) => s.getAsignaturasDisponibles);
  const getPeriodosDisponibles = useDIAStore((s) => s.getPeriodosDisponibles);

  const resultados = getAcademicosFiltrados();
  const cursos = getCursosDisponibles();
  const asignaturas = getAsignaturasDisponibles();
  const periodos = getPeriodosDisponibles();

  // ============================================
  // Computed data
  // ============================================

  const kpis = useMemo(() => {
    if (resultados.length === 0)
      return { totalEstudiantes: 0, pctNivel3: 0, pctNivel1: 0, totalCursos: 0 };

    const totalEstudiantes = resultados.reduce((a, r) => a + r.totalEvaluados, 0);
    const totalN3 = resultados.reduce((a, r) => a + r.cantidadPorNivel.III, 0);
    const totalN1 = resultados.reduce((a, r) => a + r.cantidadPorNivel.I, 0);
    const uniqueCursos = new Set(resultados.map((r) => r.curso));

    return {
      totalEstudiantes,
      pctNivel3: totalEstudiantes > 0 ? Math.round((totalN3 / totalEstudiantes) * 100) : 0,
      pctNivel1: totalEstudiantes > 0 ? Math.round((totalN1 / totalEstudiantes) * 100) : 0,
      totalCursos: uniqueCursos.size,
    };
  }, [resultados]);

  // Data for level distribution bar chart (by course)
  const nivelPorCurso = useMemo(() => {
    const courseMap = new Map<string, { curso: string; nivelI: number; nivelII: number; nivelIII: number }>();
    for (const r of resultados) {
      const key = r.curso;
      if (!courseMap.has(key)) {
        courseMap.set(key, { curso: getCursoLabel(r.curso), nivelI: 0, nivelII: 0, nivelIII: 0 });
      }
      const entry = courseMap.get(key)!;
      entry.nivelI += r.cantidadPorNivel.I;
      entry.nivelII += r.cantidadPorNivel.II;
      entry.nivelIII += r.cantidadPorNivel.III;
    }
    return Array.from(courseMap.values()).sort((a, b) => a.curso.localeCompare(b.curso));
  }, [resultados]);

  // Data for global pie chart
  const globalNiveles = useMemo(() => {
    const totals = { I: 0, II: 0, III: 0 };
    for (const r of resultados) {
      totals.I += r.cantidadPorNivel.I;
      totals.II += r.cantidadPorNivel.II;
      totals.III += r.cantidadPorNivel.III;
    }
    return [
      { name: 'Nivel III - Logra satisfactoriamente', value: totals.III, color: NIVEL_LOGRO_COLORS.III },
      { name: 'Nivel II - Logra parcialmente', value: totals.II, color: NIVEL_LOGRO_COLORS.II },
      { name: 'Nivel I - No logra', value: totals.I, color: NIVEL_LOGRO_COLORS.I },
    ];
  }, [resultados]);

  // Data for axis radar chart
  const radarData = useMemo(() => {
    const ejeMap = new Map<string, { total: number; count: number }>();
    for (const r of resultados) {
      for (const eje of r.resultadosPorEje) {
        if (!ejeMap.has(eje.eje)) ejeMap.set(eje.eje, { total: 0, count: 0 });
        const entry = ejeMap.get(eje.eje)!;
        entry.total += eje.porcentajeLogro;
        entry.count++;
      }
    }
    return Array.from(ejeMap.entries()).map(([eje, data]) => ({
      eje: eje.length > 20 ? eje.substring(0, 18) + '...' : eje,
      promedio: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }));
  }, [resultados]);

  // Student table
  const allStudents = useMemo(() => {
    return resultados.flatMap((r) =>
      r.estudiantes.map((e) => ({
        ...e,
        curso: getCursoLabel(r.curso),
        asignatura: getAsignaturaShort(r.asignatura),
        periodo: PERIODOS_LABELS[r.periodo],
      }))
    );
  }, [resultados]);

  // ============================================
  // Empty state
  // ============================================

  if (!datos || datos.academicos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-6 shadow-neon">
          <BarChart3 className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Sin datos académicos
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-sm font-medium">
          Carga planillas Excel desde la página de inicio para comenzar tu análisis de impacto pedagógico.
        </p>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard <span className="gradient-text">Académico</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Resultados del Diagnóstico Integral de Aprendizajes (DIA)
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap glass-card p-1.5 rounded-2xl shadow-sm leading-none z-10 relative">
          <div className="px-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filtrar
          </div>

          <select
            value={filters.periodo}
            onChange={(e) => setFilters({ periodo: e.target.value as Periodo | 'todos' })}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-2 focus:ring-brand-500/50 transition-all cursor-pointer outline-none"
          >
            <option value="todos">Todos los períodos</option>
            {periodos.map((p) => (
              <option key={p} value={p}>{PERIODOS_LABELS[p]}</option>
            ))}
          </select>

          <select
            value={filters.asignatura}
            onChange={(e) => setFilters({ asignatura: e.target.value as AsignaturaAcademica | 'todas' })}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-2 focus:ring-brand-500/50 transition-all cursor-pointer outline-none"
          >
            <option value="todas">Todas las materias</option>
            {asignaturas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={filters.curso}
            onChange={(e) => setFilters({ curso: e.target.value })}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-2 focus:ring-brand-500/50 transition-all cursor-pointer outline-none"
          >
            <option value="todos">Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c} value={c}>{getCursoLabel(c)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <KPICard
          label="Total Evaluados"
          value={kpis.totalEstudiantes}
          subvalue={`${kpis.totalCursos} curso(s)`}
          icon={Users}
          color="var(--color-brand-500)"
        />
        <KPICard
          label="Nivel III (Logra)"
          value={`${kpis.pctNivel3}%`}
          subvalue="Logran satisfactoriamente"
          icon={TrendingUp}
          color="var(--color-success)"
        />
        <KPICard
          label="Nivel I (No logra)"
          value={`${kpis.pctNivel1}%`}
          subvalue="Requieren intervención"
          icon={AlertTriangle}
          color="var(--color-error)"
        />
        <KPICard
          label="Cargas Activas"
          value={resultados.length}
          subvalue={`${asignaturas.length} asignatura(s)`}
          icon={GraduationCap}
          color="var(--color-neon-500)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Global Level Distribution */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Distribución Global</h3>
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-500" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={globalNiveles}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ value }) => `${value}`}
                >
                  {globalNiveles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid rgba(20, 184, 166, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    color: '#F1F5F9',
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart - Axis Performance */}
        {radarData.length > 0 && (
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Rendimiento por Eje</h3>
              <div className="w-10 h-10 rounded-xl bg-neon-50 dark:bg-neon-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-neon-500" />
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.1)" />
                  <PolarAngleAxis
                    dataKey="eje"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: '600' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#64748B', fontSize: 9 }}
                  />
                  <Radar
                    name="Logro %"
                    dataKey="promedio"
                    stroke="var(--color-brand-500)"
                    fill="var(--color-brand-500)"
                    fillOpacity={0.15}
                    strokeWidth={3}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0F172A',
                      border: '1px solid rgba(20, 184, 166, 0.2)',
                      borderRadius: '12px',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Logro']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bar Chart - Levels by Course */}
      {nivelPorCurso.length > 0 && (
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Niveles por Curso</h3>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={nivelPorCurso} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.05)" />
                <XAxis
                  dataKey="curso"
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: '600' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(20, 184, 166, 0.05)' }}
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid rgba(20, 184, 166, 0.2)',
                    borderRadius: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar dataKey="nivelIII" name="Nivel III" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="nivelII" name="Nivel II" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="nivelI" name="Nivel I" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Student Table */}
      {allStudents.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Detalle Estudiantil</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-widest">
                {allStudents.length} registros analizados
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Asignatura</th>
                  <th>Período</th>
                  <th>Puntaje</th>
                  <th>Nivel</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.slice(0, 50).map((s, idx) => (
                  <tr key={`${s.id}-${idx}`} className="group hover:bg-slate-50 dark:hover:bg-brand-500/5 transition-colors">
                    <td className="font-bold text-slate-700 dark:text-slate-200">{s.nombre}</td>
                    <td className="text-slate-500 dark:text-slate-400 font-medium">{s.curso}</td>
                    <td className="text-slate-500 dark:text-slate-400 font-medium">{s.asignatura}</td>
                    <td>
                      <span className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-tighter">
                        {s.periodo}
                      </span>
                    </td>
                    <td className="font-black text-brand-600 dark:text-brand-400">{s.puntaje}%</td>
                    <td>
                      <span
                        className={`badge ${
                          s.nivelLogro === 'III'
                            ? 'badge-green'
                            : s.nivelLogro === 'II'
                            ? 'badge-amber'
                            : 'badge-red'
                        }`}
                      >
                        Nivel {s.nivelLogro}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allStudents.length > 50 && (
              <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                Mostrando 50 de {allStudents.length} estudiantes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
