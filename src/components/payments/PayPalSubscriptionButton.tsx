'use client';

import { PayPalButtons,PayPalScriptProvider } from '@paypal/react-paypal-js';
import { getErrorMessage } from '@/lib/utils';
import { AlertCircle,Check,Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PayPalSubscriptionButtonProps {
  planId: string;
  planName: string;
  priceUSD: number;
  clientId: string;
}

export default function PayPalSubscriptionButton({
  planId,
  planName,
  priceUSD,
  clientId,
}: PayPalSubscriptionButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const redirectToPayPal = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscriptions/create-paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, returnUrl: window.location.origin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar suscripción');
      }

      // Redirigir a PayPal para aprobación
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        setStatus('success');
        setMessage(data.manual ? 'Suscripción activada manualmente' : 'Suscripción creada exitosamente');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(getErrorMessage(err, 'Error al iniciar suscripcion'));
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 p-4 bg-success/10 border border-success/20 rounded-2xl">
        <Check className="w-5 h-5 text-success" />
        <span className="text-sm font-bold text-success">{message || '¡Suscripción activada!'}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <span className="text-sm font-bold text-destructive">{message}</span>
      </div>
    );
  }

  // Si tiene precio 0 (plan gratuito), mostrar botón simple
  if (priceUSD === 0) {
    return (
      <button
        onClick={redirectToPayPal}
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

  // Planes pagos - botón PayPal o redirección
  if (clientId) {
    return (
      <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'subscription' }}>
        <div className="w-full">
          <PayPalButtons
            style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'subscribe' }}
            createSubscription={(_data, actions) => {
              return actions.subscription.create({
                plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || '',
              });
            }}
            onApprove={async (data) => {
              setStatus('loading');
              try {
                const res = await fetch('/api/payments/webhook-paypal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
                    resource: { id: data.subscriptionID, subscriber: { email_address: '' } },
                  }),
                });
                if (!res.ok) throw new Error('Error al confirmar PayPal');
                setStatus('success');
                setMessage('Suscripcion activada');
                setTimeout(() => window.location.reload(), 2000);
              } catch {
                setStatus('error');
                setMessage('Error al confirmar suscripcion con PayPal');
              }
            }}
            onError={(_err) => {
              setStatus('error');
              setMessage('Error al procesar pago con PayPal');
            }}
          />
        </div>
      </PayPalScriptProvider>
    );
  }

  // Fallback: sin SDK, redirección directa a PayPal
  return (
    <button
      onClick={redirectToPayPal}
      disabled={status === 'loading'}
      className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer border-none"
    >
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-3.95 8.21-8.78 8.21h-2.19c-.534 0-.986.373-1.068.894l-.371 2.206-.006.03-.158.948c-.08.5.316.952.812.952H14.25a.641.641 0 00.633-.534l.027-.14.404-2.547.027-.14a.641.641 0 01.633-.534h.398c3.276 0 5.84-1.33 6.59-5.17.313-1.618.15-2.97-.497-3.93" fill="currentColor"/>
          </svg>
          Suscribirse a {planName} con PayPal (${priceUSD}/mes)
        </>
      )}
    </button>
  );
}
