// src/lib/payment/types.ts
export type PaymentStatus = "approved" | "rejected" | "pending" | "timeout";

export interface PaymentResult {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: string;
    raw: Record<string, unknown>;
}

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: string;
    clientSecret: string;
    metadata?: Record<string, unknown>;
    paymentMethod?: {
        id: string;
        type: 'card';
        brand?: string;
        last4?: string;
        expMonth?: number;
        expYear?: number;
    };
}

export interface Subscription {
    id: string;
    status: 'active' | 'incomplete' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
    planId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
}

/**
 * Interface that every payment gateway adapter must implement.
 */
export interface IPaymentGateway {
    /** Create a payment (checkout session) */
    createPayment(amount: number, currency?: string): Promise<PaymentResult>;

    /** Capture a payment after approval (if applicable) */
    capturePayment(paymentId: string): Promise<PaymentResult>;

    /** Verify a webhook event */
    verifyWebhook(event: Record<string, unknown>): Promise<boolean>;
}

export interface PaymentAdapter {
    createPaymentIntent: (amount: number, currency?: string, metadata?: Record<string, unknown>) => Promise<{
        clientSecret: string;
        paymentIntentId?: string;
        success: boolean;
        error?: string;
    }>;
    createSubscription: (planId: string, priceId: string, customerEmail: string) => Promise<{
        subscriptionId?: string;
        clientSecret?: string;
        success: boolean;
        error?: string;
    }>;
    verifyWebhookSignature: (payload: string, signature: string) => boolean;
    getPaymentIntent: (paymentIntentId: string) => Promise<PaymentIntent | null>;
    getSubscription: (subscriptionId: string) => Promise<Subscription | null>;
}