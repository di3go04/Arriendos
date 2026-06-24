'use client';

import BackToHome from '@/components/shared/BackToHome';
import LanguageSelector from '@/components/LanguageSelector';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, ArrowLeft, CheckCircle, Loader2, Mail, Send } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(t('errors.invalid_form'));
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setErrorMsg(t('errors.general'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Mail className="w-6 h-6" />
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tight">{t('auth.forgot_title')}</h2>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              {t('auth.forgot_subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            <BackToHome className="mx-auto lg:mx-0 mb-4" />
            <h2 className="text-2xl font-black text-foreground">{t('auth.forgot_title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('auth.forgot_subtitle')}</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {sent ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t('auth.forgot_sent')}</p>
              </div>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.forgot_back')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('auth.forgot_title')}
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
                    placeholder={t('auth.forgot_email_placeholder')}
                    className="w-full bg-card border border-border text-foreground text-sm rounded-xl focus:border-primary block pl-10 p-3 outline-none transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-btn flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.forgot_sending')}</>
                ) : (
                  <><Send className="w-4 h-4" /> {t('auth.forgot_button')}</>
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-xs text-primary hover:text-primary-hover hover:underline font-semibold inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  {t('auth.forgot_back')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
