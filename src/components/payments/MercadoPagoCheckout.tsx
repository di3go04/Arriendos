'use client';

import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MercadoPagoCardBrick } from './MercadoPagoCardBrick';

interface MercadoPagoCheckoutProps {
  planId: string;
  label: string;
  variant?: 'primary' | 'secondary';
  currency?: string;
}

type CheckoutMode = 'checkout_api' | 'checkout_pro' | 'disabled' | 'loading';

export function MercadoPagoCheckout({
  planId,
  label,
  variant = 'primary',
  currency = 'USD',
}: MercadoPagoCheckoutProps) {
  const [mode, setMode] = useState<CheckoutMode>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmbedded, setShowEmbedded] = useState(false);

  useEffect(() => {
    fetch('/api/payments/mp-config')
      .then((r) => r.json())
      .then((data) => setMode(data.checkoutMode || 'disabled'))
      .catch(() => setMode('disabled'));
  }, []);

  const handleCheckoutPro = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, currency }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login?redirect=/precios';
          return;
        }
        throw new Error(data.error || 'Error al iniciar checkout');
      }

      const url = data.init_point || data.sandbox_init_point;
      if (url) window.location.href = url;
      else throw new Error('Mercado Pago no devolvió URL de pago');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Error al iniciar Mercado Pago');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'loading') {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mode === 'disabled') {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        Mercado Pago no configurado. Añade MP_ACCESS_TOKEN en .env.local
      </p>
    );
  }

  if (mode === 'checkout_api') {
    return (
      <div className="space-y-3">
        {!showEmbedded ? (
          <button
            type="button"
            onClick={() => setShowEmbedded(true)}
            className={`w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer border-none ${
              variant === 'primary'
                ? 'bg-primary text-white hover:bg-[#1D4ED8]'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {label}
          </button>
        ) : (
          <div className="rounded-2xl border border-border p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-4 text-center">
              Pago seguro en tu sitio (Checkout API — sin redirección)
            </p>
            <MercadoPagoCardBrick planId={planId} currency={currency} />
          </div>
        )}
        {error && (
          <p className="text-[10px] text-destructive font-semibold text-center">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleCheckoutPro}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer border-none ${
          variant === 'primary'
            ? 'bg-primary text-white hover:bg-[#1D4ED8]'
            : 'bg-card border border-border text-foreground hover:bg-muted'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {label}
            <ExternalLink className="w-3.5 h-3.5" />
          </>
        )}
      </button>
      {error && (
        <p className="text-[10px] text-destructive font-semibold text-center mt-2">{error}</p>
      )}
    </div>
  );
}
