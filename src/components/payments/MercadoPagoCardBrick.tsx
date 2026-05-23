'use client';

import { PRICING } from '@/config/payments';
import { toBrickAmount } from '@/lib/payment-amount';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MercadoPagoCardBrickProps {
  planId: string;
  currency?: string;
  onSuccess?: () => void;
}

export function MercadoPagoCardBrick({
  planId,
  currency = 'USD',
  onSuccess,
}: MercadoPagoCardBrickProps) {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const plan = PRICING[planId as keyof typeof PRICING];
  const amount = plan?.prices[currency as keyof typeof plan.prices] ?? 0;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payments/mp-config');
        const data = await res.json();
        if (!data.publicKey) {
          setError('Falta NEXT_PUBLIC_MP_PUBLIC_KEY en el servidor.');
          return;
        }
        initMercadoPago(data.publicKey, { locale: 'es-CO' });
        setPublicKey(data.publicKey);
      } catch {
        setError('No se pudo cargar la configuración de Mercado Pago.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !publicKey || !plan || amount <= 0) {
    return (
      <p className="text-sm text-destructive text-center py-4">
        {error || 'Plan o monto no válido para Checkout API.'}
      </p>
    );
  }

  return (
    <div className="relative">
      {processing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <CardPayment
        initialization={{
          amount: toBrickAmount(amount, currency),
          payer: { email: '' },
        }}
        customization={{ visual: { style: { theme: 'default' } } }}
        onSubmit={async (formData) => {
          setProcessing(true);
          setError('');
          try {
            const res = await fetch('/api/payments/process-card', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                planId,
                currency,
                token: formData.token,
                paymentMethodId: formData.payment_method_id,
                issuerId: formData.issuer_id,
                installments: formData.installments,
                payerIdentification: formData.payer?.identification,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              if (res.status === 401) {
                router.push('/login?redirect=/precios');
                return;
              }
              throw new Error(data.error || 'Pago rechazado');
            }
            if (data.status === 'approved') {
              onSuccess?.();
              router.push('/dashboard?mp_success=true');
            } else {
              router.push('/precios?mp_pending=true');
            }
          } catch (err: unknown) {
            setError((err as { message?: string }).message || 'Error al procesar el pago');
          } finally {
            setProcessing(false);
          }
        }}
        onError={(err) => {
          console.error('CardPayment brick error:', err);
          setError('Error en el formulario de pago. Revisa los datos de la tarjeta.');
        }}
      />
      {error && (
        <p className="text-xs text-destructive text-center mt-3 font-medium">{error}</p>
      )}
    </div>
  );
}
