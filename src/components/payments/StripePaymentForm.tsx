'use client';

import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/utils';
import {
Elements,
PaymentElement,
useElements,
useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

// Cargar Stripe public key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function CheckoutForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/app/payments?success=true`,
        },
      });

      if (error) {
        setErrorMessage((error as { message?: string }).message || 'Error en el pago');
        onError?.((error as { message?: string }).message || 'Error en el pago');
      } else {
        onSuccess?.();
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Error inesperado');
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl">
          {errorMessage}
        </div>
      )}
      <Button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          `Pagar ${amount > 0 ? `$${amount.toLocaleString('es-CO')}` : ''}`.trim()
        )}
      </Button>
    </form>
  );
}

export default function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#1E3A5F',
        colorBackground: '#ffffff',
        colorText: '#1a202c',
      },
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm clientSecret={clientSecret} amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
