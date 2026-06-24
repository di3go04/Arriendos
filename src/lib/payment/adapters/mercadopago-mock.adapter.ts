import { PaymentAdapter, PaymentIntent, Subscription } from '../types';

export class MercadoPagoMockAdapter implements PaymentAdapter {
    private isTestMode: boolean = true;

    async createPaymentIntent(
        amount: number,
    ): Promise<{
        clientSecret: string;
        paymentIntentId?: string;
        success: boolean;
        error?: string;
    }> {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (amount <= 0) {
            return {
                clientSecret: '',
                paymentIntentId: undefined,
                success: false,
                error: 'Amount must be greater than 0',
            };
        }

        const mockClientSecret = `mock_cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mockPaymentIntentId = `mp_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            clientSecret: mockClientSecret,
            paymentIntentId: mockPaymentIntentId,
            success: true,
        };
    }

    async createSubscription(
    ): Promise<{
        subscriptionId?: string;
        clientSecret?: string;
        success: boolean;
        error?: string;
    }> {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockSubscriptionId = `mp_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mockClientSecret = `mock_sub_cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            subscriptionId: mockSubscriptionId,
            clientSecret: mockClientSecret,
            success: true,
        };
    }

    verifyWebhookSignature(): boolean {
        return true; // Mock always returns true
    }

    async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            id: paymentIntentId,
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
            clientSecret: `mock_cs_${Date.now()}`,
            metadata: { provider: 'mercadopago-mock', test: true },
            paymentMethod: {
                id: 'mock_card_123',
                type: 'card',
                brand: 'visa',
                last4: '4242',
                expMonth: 12,
                expYear: 2025,
            },
        };
    }

    async getSubscription(subscriptionId: string): Promise<Subscription | null> {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            id: subscriptionId,
            status: 'active',
            planId: 'mock_plan_profesional',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
        };
    }

    async simulateWebhookEvent(eventType: 'payment.succeeded' | 'payment.failed', paymentIntentId: string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[Mock MercadoPago] Simulating ${eventType} for payment: ${paymentIntentId}`);
        return true;
    }

    async confirmPayment(paymentIntentId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[Mock MercadoPago] Payment confirmed: ${paymentIntentId} -> ${mockTransactionId}`);
        return { success: true, transactionId: mockTransactionId };
    }
}