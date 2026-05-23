'use client';

import { BANK_INFO,CURRENCIES,PRICING,type CurrencyCode } from '@/config/payments';
import { Banknote,Check,Copy,CreditCard,ExternalLink,Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SubscribeButtonProps {
  planId: keyof typeof PRICING;
  preferredCurrency?: CurrencyCode;
}

export default function SubscribeButton({ planId, preferredCurrency = 'USD' }: SubscribeButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'showBank'>('idle');
  const [message, setMessage] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(preferredCurrency);
  const [copied, setCopied] = useState(false);

  const loading = status === 'loading';
  const plan = PRICING[planId];
  const price = plan.prices[selectedCurrency] || 0;
  const bankInfo = (BANK_INFO as LooseRecord)[selectedCurrency];

  // Plan gratuito - activar directamente
  const activateFree = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('success');
      setMessage('¡Plan gratuito activado!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: unknown) {
      setStatus('idle');
      setMessage((err as { message?: string }).message || 'Error al procesar el pago');
    }
  };

  // Copiar datos bancarios
  const copyBankInfo = () => {
    if (!bankInfo) return;
    const text = Object.entries(bankInfo)
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Marcar pago como manual (el arrendador confirma después)
  const markManualPayment = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, status: 'pending_payment' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('success');
      setMessage('Suscripción creada. El pago queda pendiente de confirmación.');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      setStatus('idle');
      setMessage((err as { message?: string }).message || 'Error al procesar el pago');
    }
  };

  const startMercadoPagoCheckout = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, currency: selectedCurrency }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login?redirect=/precios');
          return;
        }
        throw new Error(data.error || 'No se pudo iniciar Mercado Pago');
      }
      const checkoutUrl = data.init_point || data.sandbox_init_point;
      if (!checkoutUrl) throw new Error('Mercado Pago no devolvio URL de checkout');
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      setStatus('idle');
      setMessage((err as { message?: string }).message || 'Error al procesar el pago');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 p-4 bg-success/10 border border-success/20 rounded-2xl">
        <Check className="w-5 h-5 text-success shrink-0" />
        <div>
          <p className="text-sm font-bold text-success">{message}</p>
        </div>
      </div>
    );
  }

  // Plan gratuito
  if (price === 0) {
    return (
      <button
        onClick={activateFree}
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer border-none"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Activar plan gratuito'
        )}
      </button>
    );
  }

  // Botón principal
  return (
    <div className="space-y-3">
      {/* Selector de moneda */}
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(plan.prices).filter(c => plan.prices[c as CurrencyCode] > 0).map((curr) => (
          <button
            key={curr}
            onClick={() => setSelectedCurrency(curr as CurrencyCode)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none ${
              selectedCurrency === curr
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {curr} {CURRENCIES[curr as CurrencyCode].symbol}{plan.prices[curr as CurrencyCode]}
          </button>
        ))}
      </div>

      {status === 'showBank' && bankInfo ? (
        /* Datos bancarios */
        <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5" /> Transferencia bancaria
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            {Object.entries(bankInfo).map(([key, val]) => (
              <p key={key} className="flex justify-between">
                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="text-foreground font-semibold">{String(val)}</span>
              </p>
            ))}
          </div>
          <button
            onClick={copyBankInfo}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors cursor-pointer border-none bg-transparent"
          >
            {copied ? (
              <><Check className="w-3 h-3" /> ¡Copiado!</>
            ) : (
              <><Copy className="w-3 h-3" /> Copiar datos bancarios</>
            )}
          </button>
          <button
            onClick={markManualPayment}
            disabled={loading}
            className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs transition-all cursor-pointer border-none disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Ya realicé la transferencia'
            )}
          </button>
        </div>
      ) : (
        /* Opciones de pago */
        <div className="space-y-2">
          <button
            onClick={startMercadoPagoCheckout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer border-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Pagar con Mercado Pago
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Transferencia bancaria */}
          {bankInfo && (
            <button
              onClick={() => setStatus('showBank')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5 bg-card border border-border hover:bg-muted text-foreground font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              Transferencia bancaria
            </button>
          )}

          {/* Pago manual */}
          <button
            onClick={markManualPayment}
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-2 px-5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Activar y pagar después'
            )}
          </button>
        </div>
      )}

      {message && (
        <p className="text-xs text-destructive text-center">{message}</p>
      )}
    </div>
  );
}
