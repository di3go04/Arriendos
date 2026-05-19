'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Building2, User, Mail, KeyRound, AlertTriangle, CheckCircle, Loader2, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';

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
        setErrorMsg(error.message);
      } else if (data.user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSuccessMsg('Registro exitoso. Redirigiendo...');
          setTimeout(() => {
            if (role === 'arrendador') router.push('/dashboard/landlord');
            else router.push('/dashboard/tenant');
          }, 1500);
        } else {
          setSuccessMsg(
            '¡Registro completo! Te hemos enviado un correo de confirmación. Verifica tu bandeja de entrada.'
          );
          setFullName(''); setEmail(''); setPhone(''); setRole('arrendatario');
          setPassword(''); setConfirmPassword('');
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
            <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">RentNow</h1>
            <p className="text-lg text-blue-200 max-w-md leading-relaxed">
              Únete a la plataforma líder en gestión de arrendamientos en Latinoamérica.
            </p>
            <div className="space-y-4 pt-4">
              {[
                'Firma digital de contratos con validez legal',
                'Cobros recurrentes y conciliación automatizada',
                'Panel financiero con métricas en tiempo real',
                'Notificaciones automáticas a inquilinos',
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
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <div className="lg:hidden inline-flex p-3 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] mb-4">
              <Building2 className="w-7 h-7" />
            </div>
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
            <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs flex items-start gap-2">
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
                        ? 'bg-[#2563EB] text-white shadow-sm'
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
              <div className={`relative transition-all duration-150 ${focusedField === 'name' ? 'ring-2 ring-[#2563EB]/20 rounded-xl' : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8] pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text" required value={fullName} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                  onChange={e => setFullName(e.target.value)} placeholder="Tu nombre completo"
                  className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-sm rounded-xl focus:border-[#2563EB] dark:focus:border-[#3B82F6] block pl-10 p-3 outline-none transition-all placeholder:text-[#94A3B8]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Correo</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'email' ? 'ring-2 ring-[#2563EB]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email" required value={email} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    onChange={e => setEmail(e.target.value)} placeholder="correo@ej.com"
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#2563EB] dark:focus:border-[#3B82F6] block pl-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Teléfono</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'phone' ? 'ring-2 ring-[#2563EB]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel" value={phone} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                    onChange={e => setPhone(e.target.value)} placeholder="+57 300..."
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#2563EB] dark:focus:border-[#3B82F6] block pl-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'password' ? 'ring-2 ring-[#2563EB]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    onChange={e => setPassword(e.target.value)} placeholder="Mín 6 carácteres"
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#2563EB] dark:focus:border-[#3B82F6] block pl-9 pr-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
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
                <div className={`relative transition-all duration-150 ${focusedField === 'confirm' ? 'ring-2 ring-[#2563EB]/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8] pointer-events-none">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                    onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite contraseña"
                    className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#F1F5F9] text-xs rounded-xl focus:border-[#2563EB] dark:focus:border-[#3B82F6] block pl-9 p-2.5 outline-none transition-all placeholder:text-[#94A3B8]/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-[#2563EB]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
              ) : (
                <><span>Crear cuenta</span> <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
            <span>¿Ya tienes una cuenta? </span>
            <Link href="/login" className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-semibold">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
