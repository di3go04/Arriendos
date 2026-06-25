'use client';

import { useState } from 'react';
import { Loader2, Mail, KeyRound, ArrowRight, AlertTriangle, Zap } from 'lucide-react';

export default function LoginDirectPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Login con email/password normal.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Si es la cuenta demo, redirigir a /api/auth/demo (GET)
      if (email.trim().toLowerCase() === 'demo@rentnow.app') {
        window.location.href = '/api/auth/demo';
        return;
      }

      // Login normal con Supabase desde el cliente
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg('Credenciales incorrectas. Verifica tu correo y contraseña');
        setIsSubmitting(false);
        return;
      }

      window.location.href = '/app';
    } catch {
      setErrorMsg('Error de conexión. Intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  /**
   * Login demo con un click.
   * Redirección directa a /api/auth/demo (GET) que:
   * 1. Hace login con Supabase en el servidor
   * 2. Establece la cookie de sesión
   * 3. Redirige al dashboard (/app)
   *
   * No usa fetch() para evitar que se quede colgado.
   */
  const handleDemoLogin = () => {
    setIsSubmitting(true);
    setErrorMsg('');
    // Redirección directa — el servidor hace login y redirige a /app
    window.location.href = '/api/auth/demo';
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="w-full max-w-md space-y-6 bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L2 13.2V30.8C2 31.5 2.5 32 3.2 32H13.6C14.15 32 14.6 31.55 14.6 31V20.6H17.4V31C17.4 31.55 17.85 32 18.4 32H28.8C29.5 32 30 31.5 30 30.8V13.2L16 2Z" fill="#2563EB"/>
            </svg>
            <span className="text-2xl font-black text-slate-800">
              Rent<span className="text-amber-500">Now</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
            ) : (
              <><span>Iniciar sesión</span> <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 font-semibold uppercase">Acceso Demo</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-amber-400/50 bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
          ) : (
            <><Zap className="w-4 h-4" /> Acceder con cuenta demo</>
          )}
        </button>

        <div className="text-center text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
          <span className="font-semibold">Demo:</span> demo@rentnow.app / Demo123!
          <br />
          <span className="text-[10px]">O usa el botón ⚡ de arriba</span>
        </div>
      </div>
    </main>
  );
}
