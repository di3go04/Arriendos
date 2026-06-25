'use client';

import LanguageSelector from '@/components/LanguageSelector';
import { MercadoPagoCheckout } from '@/components/payments/MercadoPagoCheckout';
import { StripeCheckoutButton } from '@/components/payments/StripeCheckoutButton';
import { Logo } from '@/components/Logo';
import { PRICING } from '@/config/payments';
import { ArrowRight, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const footerLinks = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.features', href: '#features' },
  { key: 'nav.pricing', href: '/precios' },
  { key: 'nav.developers', href: '/developers' },
  { key: 'nav.properties', href: '/propiedades' },
];

export default function PreciosPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeSource, setStripeSource] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/checkout')
      .then((r) => r.json())
      .then((d) => {
        setStripeReady(Boolean(d.configured));
        setStripeSource(d.configSource ?? null);
      })
      .catch(() => setStripeReady(false));
  }, []);

  const handleCheckout = async (planId: string) => {
    setLoading(planId);
    setError('');

    try {
      if (planId === 'basico') {
        window.location.assign(`/${locale}/register?plan=basico`);
        return;
      }

      const res = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, currency: 'USD' }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.assign(`/${locale}/login?redirect=/${locale}/precios`);
          return;
        }
        throw new Error(data.error || 'Error al iniciar checkout');
      }

      if (data.init_point) {
        window.location.assign(data.init_point);
      } else if (data.sandbox_init_point) {
        window.location.assign(data.sandbox_init_point);
      }
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Error al procesar el pago');
      setLoading(null);
    }
  };

  const planes = [
    {
      key: 'basico',
      ...PRICING.basico,
      cta: 'Comenzar gratis',
      badge: null as string | null,
    },
    {
      key: 'profesional',
      ...PRICING.profesional,
      cta: 'Elegir Profesional',
      badge: 'Más popular',
    },
    {
      key: 'empresa',
      ...PRICING.empresa,
      cta: 'Elegir Empresa',
      badge: null as string | null,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F4F6F9] text-[#1e293b]">
      <nav className="relative z-50 border-b border-[#e6edf5] bg-white/80 backdrop-blur-md" aria-label="Navegación principal">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-5 md:px-8 h-16">
          <Logo />
          <div className="hidden md:flex items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.key}
                href={link.href.startsWith('/') ? `/${locale}${link.href}` : link.href}
                className="text-sm font-medium text-[#64748b] hover:text-[#1e3a5f] transition-colors duration-200"
              >
                {t(link.key)}
              </a>
            ))}
            <LanguageSelector />
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${locale}/login`}
              className="hidden sm:inline-flex text-sm font-semibold text-[#1e3a5f] hover:text-[#152e4a] transition-colors duration-200 px-4 py-2"
            >
              {t('nav.login')}
            </a>
            <a
              href={`/${locale}/register`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-[#152e4a] px-5 py-2.5 rounded-xl shadow-[0_2px_4px_rgba(30,58,95,0.15)] hover:shadow-[0_4px_12px_rgba(30,58,95,0.25)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('nav.signup')}
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-lg transition-all duration-150 active:scale-95 select-none"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          {t('actions.back_home')}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 text-center mb-16 pt-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A202C] leading-tight">
          Planes claros para cada etapa
        </h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-semibold leading-relaxed">
          Elige el plan que mejor se adapte a tu negocio.
          {stripeReady
            ? ' Pagos internacionales en USD con Stripe (configurado en base de datos).'
            : ' Paga con tarjeta, efectivo o transferencia.'}
        </p>
        {stripeReady && (
          <p className="mt-2 text-xs font-bold text-primary">
            Stripe activo &middot; fuente: {stripeSource ?? 'ok'}
          </p>
        )}
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-5 md:px-8 mb-8">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm text-destructive font-semibold text-center">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {planes.map((plan) => (
          <div
            key={plan.key}
            className={`relative bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] ${
              plan.popular
                ? 'ring-2 ring-primary/30 shadow-[0_16px_48px_rgba(37,99,235,0.1)] md:-mt-4 md:mb-4'
                : 'hover:-translate-y-1'
            }`}
          >
            {plan.badge && (
              <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                {plan.badge}
              </div>
            )}

            <div className="p-6 sm:p-8 bg-gradient-to-b from-white/10 to-transparent border-b border-border/50">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="bg-primary/20 border border-primary/30 text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-xl">
                  {plan.name}
                </span>
                {plan.key === 'profesional' && (
                  <span className="bg-warning/15 border border-warning/30 text-warning text-[10px] font-bold px-2 py-1 rounded-xl">
                    Recomendado
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tabular-nums">
                    ${plan.prices.USD.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground shrink-0">
                    USD{plan.period}
                  </span>
                </div>
                {plan.key !== 'basico' && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>≈ ${plan.prices.COP.toLocaleString('es-CO')} COP</span>
                    <span>&middot;</span>
                    <span>≈ ${plan.prices.MXN} MXN</span>
                    <span>&middot;</span>
                    <span>≈ &euro;{plan.prices.EUR} EUR</span>
                    <span>&middot;</span>
                    <span>≈ R${plan.prices.BRL} BRL</span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {plan.key === 'basico' ? (
                  <button
                    onClick={() => handleCheckout(plan.key)}
                    disabled={loading === plan.key}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold rounded-2xl transition-all duration-200 bg-primary text-white hover:bg-[#1D4ED8] shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer border-none"
                  >
                    {loading === plan.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : stripeReady ? (
                  <StripeCheckoutButton
                    planId={plan.key}
                    planName={plan.name}
                    amountUsd={plan.prices.USD}
                    label={plan.cta}
                    variant={plan.popular ? 'primary' : 'secondary'}
                  />
                ) : (
                  <MercadoPagoCheckout
                    planId={plan.key}
                    label={plan.cta}
                    variant={plan.popular ? 'primary' : 'secondary'}
                  />
                )}
                <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium">
                  {stripeReady ? 'Pago seguro con Stripe (USD)' : 'Pago seguro con Mercado Pago'}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                Caracter&iacute;sticas incluidas
              </p>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-foreground leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-3 bg-muted/40 border border-border rounded-xl">
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  {plan.key === 'basico'
                    ? 'Plan gratuito sin costo. Perfecto para probar la plataforma.'
                    : 'Cancela en cualquier momento. Pago único mensual.'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            &iquest;Preguntas?
          </span>
          <Link
            href={`/${locale}/demo`}
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Solicitar demo &rarr;
          </Link>
        </div>
      </div>

      <footer className="bg-[#1e3a5f] text-white py-12 md:py-16 mt-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-10">
            <div className="flex flex-col items-center md:items-start gap-3">
              <Logo className="[&_span]:text-white" />
              <p className="text-white/60 text-sm max-w-xs text-center md:text-left leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {footerLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href.startsWith('/') ? `/${locale}${link.href}` : link.href}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
                >
                  {t(link.key)}
                </a>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Rentnow. {t('footer.rights')}
          </div>
        </div>
      </footer>
    </main>
  );
}
