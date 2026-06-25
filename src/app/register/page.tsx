'use client';

import BackToHome from '@/components/shared/BackToHome';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AlertTriangle,ArrowRight,CheckCircle,Eye,EyeOff,KeyRound,Loader2,Mail,Phone,User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React,{ useEffect,useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const t = useTranslations();

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
    if (user) {
      const currentRole = profile?.role || user.user_metadata?.role || 'arrendatario';
      if (currentRole === 'admin') router.push('/admin');
      else if (currentRole === 'arrendador') router.push('/dashboard/landlord');
      else router.push('/dashboard/tenant');
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) { setErrorMsg(t('register.password_mismatch')); return; }
    if (password.length < 6) { setErrorMsg(t('register.password_length')); return; }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role, phone: phone || null } },
      });

      if (error) {
        setErrorMsg((error as { message?: string }).message || t('register.error'));
      } else if (data.user) {
        // Enviar email de bienvenida
        try {
          await fetch('/api/onboarding/welcome-email', { method: 'POST' });
        } catch (e) { console.error('Register: fallo al enviar email de bienvenida', e); }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSuccessMsg(t('register.success_redirect'));
          setTimeout(() => router.push('/onboarding'), 1500);
        } else {
          setSuccessMsg(t('register.success_email'));
          setFullName(''); setEmail(''); setPhone(''); setRole('arrendatario');
          setPassword(''); setConfirmPassword('');
        }
      }
    } catch {
      setErrorMsg(t('register.unexpected_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-muted">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand via-brand-light to-brand-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="space-y-6">
            <div className="inline-flex mb-2">
              <Logo theme="dark" />
            </div>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              {t('register.hero_title')}
            </p>
            <div className="space-y-4 pt-4">
              {[
                t('register.hero_feature_1'),
                t('register.hero_feature_2'),
                t('register.hero_feature_3'),
                t('register.hero_feature_4'),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
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
            <div className="lg:hidden mb-6 flex justify-center">
              <Logo />
            </div>
            <BackToHome className="mx-auto lg:mx-0 mb-4" />
            <h2 className="text-2xl font-black text-foreground">{t('register.form_title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('register.form_subtitle')}</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-3">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 text-center">
                {t('register.role_question')}
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'arrendador' as const, label: t('register.role_landlord') },
                  { value: 'arrendatario' as const, label: t('register.role_tenant') },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      role === opt.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t('register.name_label')}</label>
              <div className={`relative transition-all duration-150 ${focusedField === 'name' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text" required value={fullName} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                  onChange={e => setFullName(e.target.value)} placeholder={t('register.name_placeholder')}
                  className="w-full bg-card border border-border text-foreground text-sm rounded-xl focus:border-primary block pl-10 p-3 outline-none transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t('register.email_label')}</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'email' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email" required value={email} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    onChange={e => setEmail(e.target.value)} placeholder={t('register.email_placeholder')}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-xl focus:border-primary block pl-9 p-2.5 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t('register.phone_label')}</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'phone' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel" value={phone} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                    onChange={e => setPhone(e.target.value)} placeholder={t('register.phone_placeholder')}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-xl focus:border-primary block pl-9 p-2.5 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t('register.password_label')}</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'password' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    onChange={e => setPassword(e.target.value)}                     placeholder={t('register.password_placeholder')}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-xl focus:border-primary block pl-9 pr-9 p-2.5 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t('register.confirm_label')}</label>
                <div className={`relative transition-all duration-150 ${focusedField === 'confirm' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                    onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder={t('register.confirm_placeholder')}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-xl focus:border-primary block pl-9 p-2.5 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-btn flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('register.creating')}</>
              ) : (
                <><span>{t('register.button')}</span> <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-muted px-3 text-muted-foreground font-semibold">
                {t('register.oauth_separator')}
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
                setErrorMsg(t('register.unexpected_error'));
              }
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t('register.google_button')}
          </button>

          <div className="text-center text-sm text-muted-foreground">
            <span>{t('register.has_account')} </span>
            <Link href="/login-direct" className="text-primary hover:underline font-semibold">
              {t('register.login_link')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
