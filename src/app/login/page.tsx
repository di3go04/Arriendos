'use client';

import { Logo } from '@/components/Logo';
import BackToHome from '@/components/shared/BackToHome';
import LanguageSelector from '@/components/LanguageSelector';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEnterpriseLogin } from '@/modules/auth-enterprise/client/use-enterprise-login';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { AlertTriangle,ArrowRight,Eye,EyeOff,KeyRound,Loader2,Mail, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React,{ useEffect,useState } from 'react';


export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale();
  const { user, profile } = useAuth();
  const { signIn } = useEnterpriseLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth-failed') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMsg(t('login.google_error'));
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      const role = profile?.role || user.user_metadata?.role || 'arrendatario';
      if (role === 'admin') router.push('/admin');
      else if (role === 'arrendador') router.push('/dashboard/landlord');
      else router.push('/dashboard/tenant');
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.debug('Attempting login for:', email);
    if (!email || !password) {
      setErrorMsg(t('login.required_fields'));
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        console.debug('Auth error:', error);
        const message = (error as { message?: string }).message || '';
        if (message === 'Invalid login credentials') {
          setErrorMsg(t('auth.invalid_credentials'));
        } else if (message.toLowerCase().includes('email not confirmed') || message.toLowerCase().includes('email not verified')) {
          setErrorMsg(t('login.email_not_confirmed'));
        } else {
          setErrorMsg(message || t('errors.general'));
        }
        return;
      }
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();
        const role = profData?.role || currentUser.user_metadata?.role || 'arrendatario';
        console.debug('User role identified:', role);
        // Redirect to callbackUrl if present, otherwise role‑based dashboard
        const callbackUrl = searchParams.get('callbackUrl');
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'arrendador') {
          router.push('/dashboard/landlord');
        } else {
          router.push('/dashboard/tenant');
        }
      }
    } catch (err) {
      console.debug('Unexpected login error:', err);
      setErrorMsg(t('errors.general'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-muted">
      <div className="absolute right-5 top-5 z-20">
        <LanguageSelector />
      </div>
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
              {t('hero.subtitle')}
            </p>
            <div className="space-y-4 pt-4">
              {[
                t('pricing.feature_digital_signature'),
                t('pricing.feature_auto_reminders'),
                t('pricing.feature_reports'),
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
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
              <Logo />
            </div>
            <BackToHome className="mx-auto lg:mx-0 mb-4" />
            <h2 className="text-2xl font-black text-foreground">{t('auth.login_title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('auth.login_subtitle')}</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t('auth.login_email')}
              </label>
              <div className={`relative transition-all duration-150 ${focusedField === 'email' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.login_email')}
                  className="w-full bg-card border border-border text-foreground text-sm rounded-xl focus:border-primary block pl-10 p-3 outline-none transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t('auth.login_password')}
              </label>
              <div className={`relative transition-all duration-150 ${focusedField === 'password' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-card border border-border text-foreground text-sm rounded-xl focus:border-primary block pl-10 pr-10 p-3 outline-none transition-all placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-3">
              <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                {t('auth.forgot_password')}
              </Link>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-btn flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.logging_in')}</>
              ) : (
                <><span>{t('auth.login_button')}</span> <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-muted px-3 text-muted-foreground font-semibold">
                {t('login.oauth_separator')}
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
                if (error) {
                  setErrorMsg(error.message);
                }
              } catch {
                    setErrorMsg(t('login.connection_error'));
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
            {t('login.continue_google')}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0] dark:border-[#334155]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F8FAFC] dark:bg-[#0F172A] px-3 text-[#94A3B8] font-semibold">
                {t('login.demo_access')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                setIsSubmitting(true);
                setErrorMsg('');
                await nextAuthSignIn('credentials', {
                  email: 'demo@rentnow.app',
                  password: 'demo',
                  callbackUrl: `${window.location.origin}/${locale}/dashboard`,
                  redirect: true,
                });
              } catch {
                setErrorMsg(t('login.demo_error'));
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gold-400/30 bg-gold-400/5 text-gold-600 dark:text-gold-400 text-sm font-bold hover:bg-gold-400/10 dark:hover:bg-gold-400/20 transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('login.demo_entering')}</>
            ) : (
              <><Zap className="w-4 h-4 text-gold-400" /> {t('login.demo_button')}</>
            )}
          </button>

          <div className="text-center text-sm text-muted-foreground">
            <span>{t('auth.no_account')} </span>
            <Link href="/register" className="text-primary hover:underline font-semibold">
              {t('auth.register_button')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
