'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Building2, KeyRound, Mail, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const role = profile?.role || user.user_metadata?.role || 'arrendatario';
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'arrendador') {
        router.push('/dashboard/landlord');
      } else {
        router.push('/dashboard/tenant');
      }
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LOGIN] Form submitted', { email });
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      console.log('[LOGIN] Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('[LOGIN] Response received', { data, error });

      if (error) {
        console.log('[LOGIN] Error:', error.message);
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
            : error.message
        );
      } else {
        console.log('[LOGIN] Success, session:', data?.session);
        console.log('[LOGIN] Fetching user profile for redirect...');
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log('[LOGIN] Current user:', currentUser);
        if (currentUser) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();
          
          const role = profData?.role || currentUser.user_metadata?.role || 'arrendatario';
          console.log('[LOGIN] Role resolved:', role);
          if (role === 'admin') {
            router.push('/admin');
          } else if (role === 'arrendador') {
            router.push('/dashboard/landlord');
          } else {
            router.push('/dashboard/tenant');
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('[LOGIN] Unexpected error:', err);
      setErrorMsg('Ocurrió un error inesperado al intentar iniciar sesión.');
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
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Arrendo
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Gestión Inteligente de Propiedades
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-black/30">
          <h2 className="text-xl font-bold mb-6 text-card-foreground text-center">
            Inicia sesión como Arrendador
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                  placeholder="arrendador@arrendo.com"
                  className="w-full bg-muted border border-border text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block pl-10 p-3 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                  placeholder="••••••••"
                  className="w-full bg-muted border border-border text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block pl-10 p-3 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>¿No tienes una cuenta? </span>
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
