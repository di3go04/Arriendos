'use client';

import BackToHome from '@/components/shared/BackToHome';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AlertTriangle,ArrowRight,Building2,CheckCircle,Eye,EyeOff,KeyRound,Loader2,Mail,Phone,User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React,{ useEffect,useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'arrendador' | 'arrendatario'>('arrendatario');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const currentRole = profile?.role || user.user_metadata?.role || 'arrendatario';
      if (currentRole === 'admin') router.push('/admin');
      else if (currentRole === 'arrendador') router.push('/dashboard/landlord');
      else router.push('/dashboard/tenant');
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) { setErrorMsg('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setErrorMsg('La contraseña debe tener al menos 6 caracteres.'); return; }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role, phone: phone || null } },
      });

      if (error) {
        setErrorMsg((error as { message?: string }).message || 'Error al registrar la cuenta.');
      } else if (data.user) {
        // Enviar email de bienvenida
        try {
          await fetch('/api/onboarding/welcome-email', { method: 'POST' });
        } catch {}

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSuccessMsg('Registro exitoso. Redirigiendo...');
          setTimeout(() => router.push('/onboarding'), 1500);
        } else {
          setSuccessMsg(
            '¡Registro completo! Te hemos enviado un correo de bienvenida. Verifica tu bandeja de entrada.'
          );
          setFullName(''); setEmail(''); setPhone(''); setRole('arrendatario');
          setPassword(''); setConfirmPassword('');
        }
      }
    } catch {
      setErrorMsg('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f] to-[#152e4a]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Rentnow</h1>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              Únete a la plataforma líder en gestión de arrendamientos en Latinoamérica.
            </p>
            <div className="space-y-4 pt-4">
              {[
                'Firma digital de contratos con validez legal',
                'Cobros recurrentes y conciliación automatizada',
                'Panel financiero con métricas en tiempo real',
                'Notificaciones automáticas a inquilinos',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <div className="lg:hidden inline-flex p-3 rounded-2xl bg-[#1e3a5f]/10 border border-[#1e3a5f]/20 text-[#1e3a5f] mb-4">
              <Building2 className="w-7 h-7" />
            </div>
            <BackToHome className="mx-auto lg:mx-0 mb-4" />
            <h2 className="text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9]">Crear cuenta</h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">Comienza a gestionar tus arrendamientos</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#4d7c0f]/10 border border-[#4d7c0f]/20 text-[#4d7c0f] text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3">
              <label className="block text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2.5 text-center">
                ¿Cuál es tu Rol?
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'arrendador' as const, label: 'Propietario / Arrendador' },
                  { value: 'arrendatario' as const, label: 'Inquilino / Arrendatario' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      role === opt.value
                        ? 'bg-[#1e3a5f] text-white shadow-sm'
                        : 'bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Nombre Completo</label>
              <div className={`relative transition-all duration-150 ${focusedField === 'name' ? 'ring-2 ring-[#1e3a5f]/20 rounded-xl' : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8] pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text" required value={fullName} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                  onChange={e => setFullName(e.target.value)} placeholder="Tu nombre completo"
                  className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-sm rounded-xl focus:border-[#1e3a5f] dark:focus:border-[#1e3a5f] block pl-10 p-3 outline-none transition-all placeholder:text-[#94A3B8]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Correo</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'email' ? 'ring-2 ring-[#1e3a5f]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email" required value={email} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    onChange={e => setEmail(e.target.value)} placeholder="correo@ej.com"
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#1e3a5f] dark:focus:border-[#1e3a5f] block pl-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Teléfono</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'phone' ? 'ring-2 ring-[#1e3a5f]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel" value={phone} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                    onChange={e => setPhone(e.target.value)} placeholder="+57 300..."
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#1e3a5f] dark:focus:border-[#1e3a5f] block pl-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'password' ? 'ring-2 ring-[#1e3a5f]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    onChange={e => setPassword(e.target.value)} placeholder="Mín 6 carácteres"
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#1e3a5f] dark:focus:border-[#1e3a5f] block pl-9 pr-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Confirmar</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'confirm' ? 'ring-2 ring-[#1e3a5f]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                    onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite contraseña"
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#1e3a5f] dark:focus:border-[#1e3a5f] block pl-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className="w-full bg-[#1e3a5f] hover:bg-[#152e4a] text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-[#1e3a5f]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
              ) : (
                <><span>Crear cuenta</span> <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0] dark:border-[#334155]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F8FAFC] dark:bg-[#0F172A] px-3 text-[#94A3B8] font-semibold">
                O regístrate con
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                if (error) setErrorMsg(error.message);
              } catch {
                setErrorMsg('Error de conexión con el servidor. Intenta de nuevo.');
              }
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#F1F5F9] text-sm font-semibold hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]/80 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Registrarse con Google
          </button>

          <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
            <span>¿Ya tienes una cuenta? </span>
            <Link href="/login" className="text-[#1e3a5f] dark:text-[#1e3a5f] hover:underline font-semibold">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
