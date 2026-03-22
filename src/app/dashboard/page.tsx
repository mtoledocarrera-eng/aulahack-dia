'use client';

import { useDIAStore } from '@/lib/store/dia-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardIndex() {
  const router = useRouter();
  const datos = useDIAStore((s) => s.datos);

  useEffect(() => {
    if (datos && datos.academicos.length > 0) {
      router.replace('/dashboard/academico');
    } else {
      router.replace('/');
    }
  }, [datos, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-[var(--color-text-muted)]">Redirigiendo...</p>
    </div>
  );
}
