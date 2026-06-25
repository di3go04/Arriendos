import Stripe from 'stripe';
import { PaymentAdapter, PaymentIntent, Subscription } from '../types';

export class StripeAdapter implements PaymentAdapter {
    private isTestMode: boolean;

    constructor() {
        this.isTestMode = !!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    }

    private get client() {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
        return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
    }

    async createPaymentIntent(
        amount: number,
        currency: string = 'usd',
        metadata?: Record<string, unknown>
    ): Promise<{
        clientSecret: string;
        paymentIntentId?: string;
        success: boolean;
        error?: string;
    }> {
        try {
            const paymentIntent = await this.client.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency,
                metadata: (metadata || {}) as Stripe.MetadataParam,
                automatic_payment_methods: { enabled: true },
            });

            return {
                clientSecret: paymentIntent.client_secret || '',
                paymentIntentId: paymentIntent.id,
                success: true,
            };
        } catch (error: unknown) {
            return {
                clientSecret: '',
                paymentIntentId: undefined,
                success: false,
                error: error instanceof Error ? error.message : 'Error creating payment intent',
            };
        }
    }

    async createSubscription(
        planId: string,
        priceId: string,
        customerEmail: string
    ): Promise<{
        subscriptionId?: string;
        clientSecret?: string;
        success: boolean;
        error?: string;
    }> {
        try {
            const customer = await this.client.customers.create({
                email: customerEmail,
                payment_method: 'pm_card_visa',
                invoice_settings: { default_payment_method: 'pm_card_visa' },
            });

            const subscription = await this.client.subscriptions.create({
                customer: customer.id,
                items: [{ price: priceId }],
                expand: ['latest_invoice.payment_intent'],
            });

            const invoice = subscription.latest_invoice;
            const paymentIntent = (invoice as { payment_intent?: { client_secret?: string } }).payment_intent;

            return {
                subscriptionId: subscription.id,
                clientSecret: paymentIntent?.client_secret || '',
                success: true,
            };
        } catch (error: unknown) {
            return {
                subscriptionId: undefined,
                clientSecret: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error creating subscription',
            };
        }
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
        if (!secret) return false;

        try {
            const event = this.client.webhooks.constructEvent(payload, signature, secret);
            return !!event;
        } catch {
            return false;
        }
    }

    async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
        try {
            const intent = await this.client.paymentIntents.retrieve(paymentIntentId);
            return {
                id: intent.id,
                amount: intent.amount / 100,
                currency: intent.currency,
                status: intent.status as PaymentIntent['status'],
                clientSecret: intent.client_secret || '',
                metadata: intent.metadata as Record<string, unknown>,
                paymentMethod: intent.payment_method
                    ? {
                        id: intent.payment_method as string,
                        type: 'card' as const,
                        brand: (intent.payment_method as unknown as { card?: { brand?: string } }).card?.brand,
                        last4: (intent.payment_method as unknown as { card?: { last4?: string } }).card?.last4,
                        expMonth: (intent.payment_method as unknown as { card?: { exp_month?: number } }).card?.exp_month,
                        expYear: (intent.payment_method as unknown as { card?: { exp_year?: number } }).card?.exp_year,
                    }
                    : undefined,
            };
        } catch {
            return null;
        }
    }

    async getSubscription(subscriptionId: string): Promise<Subscription | null> {
        try {
            const sub = await this.client.subscriptions.retrieve(subscriptionId);
            const statusMap: Record<string, Subscription['status']> = {
                active: 'active',
                incomplete: 'incomplete',
                past_due: 'past_due',
                canceled: 'canceled',
                unpaid: 'unpaid',
            };
            const mappedStatus = statusMap[sub.status] || 'active';

            return {
                id: sub.id,
                status: mappedStatus,
                planId: sub.items.data[0]?.price.id || '',
                currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
                cancelAtPeriodEnd: (sub as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end,
            };
        } catch {
            return null;
        }
    }
}