'use client';

import FileUploader from '@/components/upload/FileUploader';
import { useDIAStore } from '@/lib/store/dia-store';
import { useRouter } from 'next/navigation';
import { BarChart3, BookOpen, Brain, Users, ArrowRight, Database, Star } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  const datos = useDIAStore((s) => s.datos);
  const router = useRouter();

  const hasData = datos && datos.academicos.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" alt="AulaHack Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">
              AulaHack
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {hasData ? (
              <button
                className="btn-primary"
                onClick={() => router.push('/dashboard/academico')}
              >
                Ir al Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => router.push('/login')}
              >
                Ingresar
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[var(--color-dia-purple)]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center mb-12 animate-fade-in relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 text-brand-500 text-sm font-semibold mb-8 border border-brand-500/20 shadow-neon">
            <Star className="w-4 h-4" />
            <span>Nueva Plataforma Inteligente</span>
          </div>

          <h1
            className="text-4xl md:text-7xl font-black mb-6 tracking-tight leading-[1.05] text-slate-800 dark:text-slate-100"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Potencia tu <span className="gradient-text">Análisis DIA</span> <br /> 
            con Inteligencia Artificial
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Bienvenidos a la evolución del diagnóstico escolar. Carga tus resultados y deja que <strong className="text-brand-600 dark:text-brand-400">AulaHack</strong> transforme datos estáticos en estrategias pedagógicas de impacto inmediato.
          </p>
        </div>

        {/* File Uploader */}
        <div className="w-full max-w-2xl animate-slide-up">
          <FileUploader />
        </div>

        {/* Quick navigation if data exists */}
        {hasData && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl stagger-children">
            <button
              onClick={() => router.push('/dashboard/academico')}
              className="glass-card p-6 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg gradient-blue flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Académico</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {datos.academicos.length} resultado(s) cargados
              </p>
            </button>

            <button
              onClick={() => router.push('/dashboard/socioemocional')}
              className="glass-card p-6 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg gradient-amber flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5 text-warning" />
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Socioemocional</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {datos.socioemocionales.length} resultado(s)
              </p>
            </button>

            <button
              onClick={() => router.push('/dashboard/convivencia')}
              className="glass-card p-6 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg gradient-green flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Convivencia</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {datos.convivencia.length} resultado(s)
              </p>
            </button>
          </div>
        )}

        {/* Features when no data */}
        {!hasData && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl stagger-children">
            {[
              {
                icon: <Database className="w-5 h-5 text-brand-500" />,
                gradient: 'gradient-blue',
                title: 'Carga tus datos',
                desc: 'Sube las planillas Excel exportadas desde la plataforma DIA',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-success" />,
                gradient: 'gradient-green',
                title: 'Análisis automático',
                desc: 'Gráficos interactivos por nivel de logro, ejes y tendencias',
              },
              {
                icon: <BookOpen className="w-5 h-5 text-warning" />,
                gradient: 'gradient-amber',
                title: 'Compara períodos',
                desc: 'Visualiza la evolución Diagnóstico → Intermedio → Cierre',
              },
            ].map((feature, idx) => (
              <div key={idx} className="glass-card p-6">
                <div className={`w-10 h-10 rounded-lg ${feature.gradient} flex items-center justify-center mb-3`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)] font-medium">
        AulaHack — IA & Analítica Pedagógica de Vanguardia
      </footer>
    </div>
  );
}
