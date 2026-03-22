'use client';

import { FileText } from 'lucide-react';

export default function ReportesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
      <div className="w-16 h-16 rounded-2xl gradient-blue flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-brand-500" />
      </div>
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        Módulo Reportes
      </h2>
      <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">
        Próximamente: Generación automática de reportes pedagógicos, análisis
        cruzado académico-socioemocional y exportación de datos.
      </p>
    </div>
  );
}
