'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  Brain,
  Users,
  FileText,
  Home,
  Upload,
  ChevronLeft,
  X,
  Menu,
  AlertTriangle,
  HeartHandshake,
  Archive
} from 'lucide-react';
import { useState } from 'react';
import { useDIAStore } from '@/lib/store/dia-store';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/dashboard/academico', icon: BookOpen, label: 'Dashboard Académico' },
  { href: '/dashboard/herramientas/grupos', icon: Users, label: 'Match de Aprendizaje' },
  { href: '/dashboard/herramientas/riesgo', icon: AlertTriangle, label: 'Matriz de Riesgo' },
  { href: '/dashboard/herramientas/dua', icon: BookOpen, label: 'Estrategias DUA' },
  { href: '/dashboard/herramientas/tickets', icon: FileText, label: 'Tickets de Salida' },
  { href: '/dashboard/herramientas/clima', icon: HeartHandshake, label: 'Clima y Socioemocional' },
  { href: '/dashboard/historial', icon: Archive, label: 'Mi Historial' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const datos = useDIAStore((s) => s.datos);
  const { logout, user } = useAuth();

  const acadCount = datos?.academicos.length || 0;
  const socioCount = datos?.socioemocionales.length || 0;
  const convCount = datos?.convivencia.length || 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-[var(--color-bg-sidebar)]/70 backdrop-blur-[24px] border-r border-[var(--color-border)] flex flex-col transition-all duration-300 shrink-0 print:hidden relative`}
      >
        {/* Subtle natural accent glow in sidebar */}
        <div className="absolute inset-0 bg-brand-950/20 pointer-events-none" />
        
        {/* Logo */}
        <div className="p-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 relative z-10">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="AulaHack" className="w-full h-full object-contain rounded-lg" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden flex items-center">
              <span className="font-display text-xl font-bold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
                AulaHack
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-3' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[var(--color-border)] flex flex-col gap-2 relative z-10">
          {user && (
            <button
              onClick={logout}
              className={`flex items-center gap-2 p-2 w-full text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ${sidebarOpen ? 'justify-start px-2' : 'justify-center'}`}
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Cerrar Sesión</span>}
            </button>
          )}

          <div className={`flex items-center ${sidebarOpen ? 'justify-between px-2' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-xs font-semibold text-slate-500">Tema</span>}
            <ThemeToggle />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="nav-link w-full justify-center"
            title="Colapsar menú"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
    </ProtectedRoute>
  );
}
