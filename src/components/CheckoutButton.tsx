"use client";

import { useRouter } from 'next/navigation';
import { paymentFactory } from '@/lib/payment/factory';

interface CheckoutButtonProps {
    provider: 'stripe' | 'mercadopago';
    amount: number;
    currency?: string;
}

export default function CheckoutButton({ provider, amount, currency = 'usd' }: CheckoutButtonProps) {
    const router = useRouter();

    const handleClick = async () => {
        // Initialize provider
        paymentFactory.setProvider(provider);
        const adapter = paymentFactory.getAdapter();
        const { clientSecret, paymentIntentId, success } = await adapter.createPaymentIntent(amount, currency);
        if (!success) {
            alert('Error al crear el pago');
            return;
        }
        // Redirect to test page where user can confirmar (simulado)
        router.push(`/test-pago?method=${provider}&clientSecret=${clientSecret}&paymentIntentId=${paymentIntentId}`);
    };

    return (
        <button onClick={handleClick} className="px-4 py-2 bg-primary text-white rounded">
            Pagar {amount > 0 ? `$${amount}` : ''} con {provider === 'stripe' ? 'Stripe' : 'Mercado Pago'}
        </button>
    );
}
