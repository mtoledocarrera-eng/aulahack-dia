'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { user, signUpWithEmail, loading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard/academico');
    }
  }, [user, loading, router]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsRegistering(true);
    try {
      await signUpWithEmail(email, password);
      // Navigation is handled inside AuthContext's signUpWithEmail
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico no válido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil.');
      } else {
        setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[var(--color-dia-purple)]/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Top Logo */}
      <div className="mb-8 text-center relative z-10 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="AulaHack Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Aula<span className="text-[#f97316]">Hack</span>
          </h1>
        </Link>
        
        <h2 className="text-3xl font-bold text-white mb-2">Crea tu cuenta</h2>
        <p className="text-slate-400">Únete a AulaHack para transformar tus datos en estrategias.</p>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-[400px] bg-slate-950/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 relative z-10 shadow-2xl">
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.cl"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caracteres"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Confirmar Contraseña</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
            />
          </div>

          <button 
            type="submit" 
            disabled={isRegistering}
            className="w-full mt-4 px-4 py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-bold transition-all shadow-neon flex items-center justify-center gap-2"
          >
            {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
            {!isRegistering && <span>→</span>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link 
              href="/login"
              className="text-brand-500 hover:text-brand-400 font-bold hover:underline transition-all"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
