'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Building2, KeyRound, Mail, AlertTriangle, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const role = profile?.role || user.user_metadata?.role || 'arrendatario';
      if (role === 'admin') router.push('/admin');
      else if (role === 'arrendador') router.push('/dashboard/landlord');
      else router.push('/dashboard/tenant');
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
            : error.message
        );
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: profData } = await supabase
            .from('profiles').select('role').eq('id', currentUser.id).single();
          const role = profData?.role || currentUser.user_metadata?.role || 'arrendatario';
          if (role === 'admin') router.push('/admin');
          else if (role === 'arrendador') router.push('/dashboard/landlord');
          else router.push('/dashboard/tenant');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#1E40AF] to-[#0F172A]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="space-y-6">
            <div className="inline-flex mb-2">
              <img src="/logo-light.svg" alt="RentNow" className="h-12 w-auto" />
            </div>
            <p className="text-lg text-blue-200 max-w-md leading-relaxed">
              Gestión profesional de arrendamientos. Contratos, pagos e inquilinos en un solo lugar.
            </p>
            <div className="space-y-4 pt-4">
              {[
                'Firma digital de contratos con validez legal',
                'Cobros recurrentes y conciliación automatizada',
                'Panel financiero con métricas en tiempo real',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
              <img src="/logo.svg" alt="RentNow" className="h-10 w-auto dark:hidden" />
              <img src="/logo-light.svg" alt="RentNow" className="h-10 w-auto hidden dark:block" />
            </div>
            <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9]">Bienvenido de vuelta</h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">Inicia sesión para continuar</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className={`relative transition-all duration-150 ${focusedField === 'email' ? 'ring-2 ring-[#2563EB]/20 rounded-xl' : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8] pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-sm rounded-xl focus:border-[#2563EB] dark:focus:border-[#3B82F6] block pl-10 p-3 outline-none transition-all placeholder:text-[#94A3B8]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className={`relative transition-all duration-150 ${focusedField === 'password' ? 'ring-2 ring-[#2563EB]/20 rounded-xl' : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8] pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-sm rounded-xl focus:border-[#2563EB] dark:focus:border-[#3B82F6] block pl-10 pr-10 p-3 outline-none transition-all placeholder:text-[#94A3B8]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-[#2563EB]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
              ) : (
                <><span>Iniciar sesión</span> <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
            <span>¿No tienes una cuenta? </span>
            <Link href="/register" className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-semibold">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
