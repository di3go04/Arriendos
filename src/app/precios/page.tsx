'use client';

import { MercadoPagoCheckout } from '@/components/payments/MercadoPagoCheckout';
import { StripeCheckoutButton } from '@/components/payments/StripeCheckoutButton';
import BackToHome from '@/components/shared/BackToHome';
import { PRICING } from '@/config/payments';
import { ArrowRight,Check,Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PreciosPage() {
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
        window.location.href = '/register?plan=basico';
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
          window.location.href = '/login?redirect=/precios';
          return;
        }
        throw new Error(data.error || 'Error al iniciar checkout');
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point;
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
      badge: null,
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
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-8">
        <BackToHome />
      </div>

      <div className="max-w-7xl mx-auto text-center mb-16">
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
            Stripe activo · fuente: {stripeSource ?? 'ok'}
          </p>
        )}
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm text-destructive font-semibold text-center">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
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

              {/* Precios en múltiples monedas */}
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
                    <span>·</span>
                    <span>≈ ${plan.prices.MXN} MXN</span>
                    <span>·</span>
                    <span>≈ €{plan.prices.EUR} EUR</span>
                    <span>·</span>
                    <span>≈ R${plan.prices.BRL} BRL</span>
                  </div>
                )}
              </div>

                {/* Botón CTA con Mercado Pago */}
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

            {/* Features */}
            <div className="p-6 sm:p-8">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                Características incluidas
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

      <div className="max-w-7xl mx-auto mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            ¿Preguntas?
          </span>
          <Link
            href="/demo"
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Solicitar demo →
          </Link>
        </div>
      </div>
    </div>
  );
}