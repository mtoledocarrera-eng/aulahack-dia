'use client';

import { Users } from 'lucide-react';

export default function ConvivenciaPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
      <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-success" />
      </div>
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        Módulo Convivencia
      </h2>
      <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">
        Próximamente: Modelo multinivel de convivencia escolar con niveles de apoyo
        Universal, Focalizado e Intensivo. Sube los cuestionarios de convivencia
        del DIA para habilitar este módulo.
      </p>
    </div>
  );
}
