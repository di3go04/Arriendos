import { PaymentAdapter } from './types';
import { StripeAdapter } from './adapters/stripe.adapter';
import { MercadoPagoMockAdapter } from './adapters/mercadopago-mock.adapter';

export class PaymentFactory {
    private static instance: PaymentFactory;
    private adapter: PaymentAdapter | null = null;

    private constructor() { }

    static getInstance(): PaymentFactory {
        if (!PaymentFactory.instance) {
            PaymentFactory.instance = new PaymentFactory();
        }
        return PaymentFactory.instance;
    }

    setProvider(provider: 'stripe' | 'mercadopago'): void {
        switch (provider) {
            case 'stripe':
                this.adapter = new StripeAdapter();
                break;
            case 'mercadopago':
                this.adapter = new MercadoPagoMockAdapter();
                break;
            default:
                throw new Error(`Unsupported payment provider: ${provider}`);
        }
    }

    getAdapter(): PaymentAdapter {
        if (!this.adapter) {
            throw new Error('Payment adapter not initialized. Call setProvider() first.');
        }
        return this.adapter;
    }

    getProvider(): string {
        if (this.adapter instanceof StripeAdapter) {
            return 'stripe';
        } else if (this.adapter instanceof MercadoPagoMockAdapter) {
            return 'mercadopago';
        }
        return 'unknown';
    }

    isTestMode(): boolean {
        if (this.adapter instanceof StripeAdapter) {
            return this.adapter['isTestMode'];
        } else if (this.adapter instanceof MercadoPagoMockAdapter) {
            return this.adapter['isTestMode'];
        }
        return false;
    }
}

export const paymentFactory = PaymentFactory.getInstance();