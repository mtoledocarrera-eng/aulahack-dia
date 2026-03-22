'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DatosDIA,
  ResultadoCursoAcademico,
  ResultadoSocioemocional,
  ResultadoConvivencia,
  Periodo,
  AsignaturaAcademica,
} from '@/lib/types/dia';
import { saveDatasetToCloud, loadDatasetFromCloud } from '../firebase/db';

interface Filters {
  periodo: Periodo | 'todos';
  asignatura: AsignaturaAcademica | 'todas';
  curso: string | 'todos';
}

interface DIAState {
  // Data
  datos: DatosDIA | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: Filters;

  // Cloud State
  cloudSyncing: boolean;
  cloudSyncError: string | null;

  // Actions
  setDatos: (datos: DatosDIA) => void;
  syncToCloud: (userId: string) => Promise<void>;
  loadFromCloud: (userId: string) => Promise<void>;
  addAcademicos: (resultados: ResultadoCursoAcademico[]) => void;
  addSocioemocionales: (resultados: ResultadoSocioemocional[]) => void;
  addConvivencia: (resultados: ResultadoConvivencia[]) => void;
  setFilters: (filters: Partial<Filters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;

  // Computed / Selectors
  getAcademicosFiltrados: () => ResultadoCursoAcademico[];
  getCursosDisponibles: () => string[];
  getAsignaturasDisponibles: () => AsignaturaAcademica[];
  getPeriodosDisponibles: () => Periodo[];
}

const initialFilters: Filters = {
  periodo: 'todos',
  asignatura: 'todas',
  curso: 'todos',
};

export const useDIAStore = create<DIAState>()(
  persist(
    (set, get) => ({
      datos: null,
      isLoading: false,
      error: null,
      cloudSyncing: false,
      cloudSyncError: null,
      filters: initialFilters,

      setDatos: (datos) => set({ datos, error: null }),
      
      syncToCloud: async (userId: string) => {
        const { datos } = get();
        if (!datos) return;
        set({ cloudSyncing: true, cloudSyncError: null });
        try {
          await saveDatasetToCloud(userId, datos);
        } catch (error: any) {
          console.error('Error salvando a la nube:', error);
          set({ cloudSyncError: error.message });
        } finally {
          set({ cloudSyncing: false });
        }
      },

      loadFromCloud: async (userId: string) => {
        set({ cloudSyncing: true, cloudSyncError: null });
        try {
          const cloudData = await loadDatasetFromCloud(userId);
          if (cloudData) {
            set({ datos: cloudData });
          }
        } catch (error: any) {
          console.error('Error cargando desde la nube:', error);
          set({ cloudSyncError: error.message });
        } finally {
          set({ cloudSyncing: false });
        }
      },

      addAcademicos: (resultados) => {
        const state = get();
        if (!state.datos) {
          set({
            datos: {
              rbd: resultados[0]?.rbd || '',
              nombreEstablecimiento: '',
              año: resultados[0]?.año || new Date().getFullYear(),
              academicos: resultados,
              socioemocionales: [],
              convivencia: [],
            },
            error: null,
          });
        } else {
          // Merge: replace duplicates, add new ones
          const existing = state.datos.academicos;
          const merged = [...existing];
          
          for (const r of resultados) {
            const idx = merged.findIndex(
              (e) => e.asignatura === r.asignatura && e.curso === r.curso && e.periodo === r.periodo
            );
            if (idx >= 0) {
              merged[idx] = r;
            } else {
              merged.push(r);
            }
          }

          set({
            datos: { ...state.datos, academicos: merged },
            error: null,
          });
        }
      },

      addSocioemocionales: (resultados) => {
        const state = get();
        if (!state.datos) return;
        const existing = state.datos.socioemocionales;
        const merged = [...existing];
        for (const r of resultados) {
          const idx = merged.findIndex(
            (e) => e.curso === r.curso && e.periodo === r.periodo
          );
          if (idx >= 0) merged[idx] = r;
          else merged.push(r);
        }
        set({ datos: { ...state.datos, socioemocionales: merged } });
      },

      addConvivencia: (resultados) => {
        const state = get();
        if (!state.datos) return;
        const existing = state.datos.convivencia;
        const merged = [...existing];
        for (const r of resultados) {
          const idx = merged.findIndex(
            (e) => e.curso === r.curso && e.periodo === r.periodo
          );
          if (idx >= 0) merged[idx] = r;
          else merged.push(r);
        }
        set({ datos: { ...state.datos, convivencia: merged } });
      },

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearData: () => set({ datos: null, filters: initialFilters, error: null }),

      getAcademicosFiltrados: () => {
        const { datos, filters } = get();
        if (!datos) return [];
        let result = datos.academicos;
        if (filters.periodo !== 'todos') {
          result = result.filter((r) => r.periodo === filters.periodo);
        }
        if (filters.asignatura !== 'todas') {
          result = result.filter((r) => r.asignatura === filters.asignatura);
        }
        if (filters.curso !== 'todos') {
          result = result.filter((r) => r.curso === filters.curso);
        }
        return result;
      },

      getCursosDisponibles: () => {
        const { datos } = get();
        if (!datos) return [];
        const cursos = new Set<string>();
        datos.academicos.forEach((r) => cursos.add(r.curso));
        datos.socioemocionales.forEach((r) => cursos.add(r.curso));
        datos.convivencia.forEach((r) => cursos.add(r.curso));
        return Array.from(cursos).sort();
      },

      getAsignaturasDisponibles: () => {
        const { datos } = get();
        if (!datos) return [];
        const asignaturas = new Set<AsignaturaAcademica>();
        datos.academicos.forEach((r) => asignaturas.add(r.asignatura));
        return Array.from(asignaturas);
      },

      getPeriodosDisponibles: () => {
        const { datos } = get();
        if (!datos) return [];
        const periodos = new Set<Periodo>();
        datos.academicos.forEach((r) => periodos.add(r.periodo));
        return Array.from(periodos);
      },
    }),
    {
      name: 'dia-analysis-store',
      partialize: (state) => ({
        datos: state.datos,
        filters: state.filters,
      }),
    }
  )
);
