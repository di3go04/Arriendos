"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { paymentFactory } from '@/lib/payment/factory';

export default function TestPagoPage() {
    const searchParams = useSearchParams();
    const method = searchParams.get('method');
    const clientSecret = searchParams.get('clientSecret');
    const paymentIntentId = searchParams.get('paymentIntentId');

    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!method || !clientSecret) return;
        const run = async () => {
            setStatus('processing');
            paymentFactory.setProvider(method as 'stripe' | 'mercadopago');
            const adapter = paymentFactory.getAdapter();
            // For mock we just confirm immediately
            if (method === 'mercadopago') {
                // Simulate confirmation
                await (adapter as any).confirmPayment(paymentIntentId);
                setStatus('success');
                return;
            }
            // For Stripe we would normally use Stripe.js, but here we just simulate success
            setStatus('success');
        };
        run();
    }, [method, clientSecret, paymentIntentId]);

    if (!method) {
        return <div>Metodo de pago no especificado.</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl mb-4">Prueba de Pago ({method})</h1>
            {status === 'idle' && <p>Preparando pago...</p>}
            {status === 'processing' && <p>Procesando pago...</p>}
            {status === 'success' && <p className="text-green-600">Pago exitoso! 🎉</p>}
            {status === 'error' && <p className="text-red-600">Error al procesar el pago.</p>}
        </div>
    );
}
