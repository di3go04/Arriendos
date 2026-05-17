'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Building2, User, Mail, KeyRound, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'arrendador' | 'arrendatario'>('arrendatario');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const currentRole = profile?.role || user.user_metadata?.role || 'arrendatario';
      if (currentRole === 'admin') {
        router.push('/admin');
      } else if (currentRole === 'arrendador') {
        router.push('/dashboard/landlord');
      } else {
        router.push('/dashboard/tenant');
      }
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            phone: phone || null,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        // Check if session was auto-established
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSuccessMsg('Registro exitoso. Redirigiendo al panel...');
          setTimeout(() => {
            if (role === 'arrendador') {
              router.push('/dashboard/landlord');
            } else {
              router.push('/dashboard/tenant');
            }
          }, 1500);
        } else {
          setSuccessMsg(
            '¡Registro completo! Te hemos enviado un correo de confirmación (si está activo en tu cuenta). Por favor, verifica tu bandeja de entrada o inicia sesión.'
          );
          setFullName('');
          setEmail('');
          setPhone('');
          setRole('arrendatario');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      setErrorMsg('Ocurrió un error inesperado al intentar crear tu cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="w-full max-w-md">
        
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Arrendo
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Gestión Inteligente y Firma de Contratos
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/30">
          <h2 className="text-lg font-bold mb-4 text-card-foreground text-center">
            Únete a la Plataforma
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Selector de Rol Premium con Radio Buttons */}
            <div className="bg-muted/40 border border-border/80 rounded-xl p-4.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 text-center">
                ¿Cuál es tu Rol?
              </label>
              <div className="flex justify-center gap-8 py-1">
                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none group">
                  <input
                    type="radio"
                    name="role"
                    value="arrendador"
                    checked={role === 'arrendador'}
                    onChange={() => setRole('arrendador')}
                    className="w-4 h-4 text-primary bg-muted border-border focus:ring-primary focus:ring-offset-background cursor-pointer"
                  />
                  <span className="group-hover:text-primary transition-colors">Propietario / Arrendador</span>
                </label>
                
                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none group">
                  <input
                    type="radio"
                    name="role"
                    value="arrendatario"
                    checked={role === 'arrendatario'}
                    onChange={() => setRole('arrendatario')}
                    className="w-4 h-4 text-primary bg-muted border-border focus:ring-primary focus:ring-offset-background cursor-pointer"
                  />
                  <span className="group-hover:text-primary transition-colors">Inquilino / Arrendatario</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu Nombre y Apellido"
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-ring focus:border-ring block pl-10 p-3 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-ring focus:border-ring block pl-10 p-3 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +57 300 123 4567"
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-ring focus:border-ring block p-3 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-ring focus:border-ring block pl-10 p-3 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite contraseña"
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-ring focus:border-ring block pl-10 p-3 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <span>Registrarse</span>
              )}
            </button>
          </form>


          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>¿Ya tienes una cuenta? </span>
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
