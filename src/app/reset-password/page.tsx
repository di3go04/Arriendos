'use client';

import BackToHome from '@/components/shared/BackToHome';
import LanguageSelector from '@/components/LanguageSelector';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

function checkValidToken(): boolean | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('code') || params.get('token')) return true;
  return false;
}

export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validToken] = useState(checkValidToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg(t('auth.password_min_length'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.password_mismatch'));
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setErrorMsg(t('errors.general'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validToken === false) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t('auth.reset_error_token')}</h2>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-all"
          >
            {t('auth.forgot_button')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex bg-background">
      <div className="absolute right-5 top-5 z-20">
        <LanguageSelector />
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand via-brand-light to-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tight">{t('auth.reset_title')}</h2>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              {t('auth.reset_subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <BackToHome className="mx-auto lg:mx-0 mb-4" />
            <h2 className="text-2xl font-black text-foreground">{t('auth.reset_title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('auth.reset_subtitle')}</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t('auth.reset_success')}</p>
                <p className="text-xs text-muted-foreground">{t('auth.logging_in')}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('auth.reset_new_password')}
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
                    placeholder={t('auth.reset_placeholder_password')}
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

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('auth.reset_confirm_password')}
                </label>
                <div className={`relative transition-all duration-150 ${focusedField === 'confirm' ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}>
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.reset_placeholder_confirm')}
                    className="w-full bg-card border border-border text-foreground text-sm rounded-xl focus:border-primary block pl-10 pr-10 p-3 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-btn flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.reset_resetting')}</>
                ) : (
                  <><Lock className="w-4 h-4" /> {t('auth.reset_button')}</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
