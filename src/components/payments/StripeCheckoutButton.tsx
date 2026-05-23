'use client';

import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface StripeCheckoutButtonProps {
  planId: string;
  planName: string;
  /** Precio en USD (dólares) */
  amountUsd: number;
  label: string;
  variant?: 'primary' | 'secondary';
  /** Email forzado (ej. prueba admin) */
  customerEmail?: string;
}

export function StripeCheckoutButton({
  planId,
  planName,
  amountUsd,
  label,
  variant = 'primary',
  customerEmail: forcedEmail,
}: StripeCheckoutButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');

    const email = forcedEmail || user?.email;
    if (!email) {
      window.location.href = `/login?redirect=${encodeURIComponent('/precios')}`;
      return;
    }

    try {
      const returnUrl = window.location.origin;
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          returnUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent('/precios')}`;
          return;
        }
        throw new Error(data.error || 'No se pudo iniciar el pago');
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.success && planId === 'basico') {
        window.location.href = '/dashboard';
        return;
      }

      throw new Error('Stripe no devolvió URL de checkout');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de pago');
      setLoading(false);
    }
  };

  const baseClass =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-[#1D4ED8]'
      : 'bg-card text-foreground border border-border hover:bg-muted';

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 ${baseClass}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {label}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {error && (
        <p className="text-[10px] text-destructive font-semibold text-center mt-2">{error}</p>
      )}
    </div>
  );
}
