'use client';

import { Brain } from 'lucide-react';

export default function SocioemocionalPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
      <div className="w-16 h-16 rounded-2xl gradient-amber flex items-center justify-center mb-4">
        <Brain className="w-8 h-8 text-warning" />
      </div>
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        Módulo Socioemocional
      </h2>
      <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">
        Próximamente: Análisis de cuestionarios socioemocionales con dimensiones
        Personal, Comunitario y Ciudadano. Sube los cuestionarios socioemocionales
        del DIA para habilitar este módulo.
      </p>
    </div>
  );
}
