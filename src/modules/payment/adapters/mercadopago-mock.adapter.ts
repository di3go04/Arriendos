import { v4 as uuidv4 } from "uuid";
import { IPaymentGateway, PaymentResult, PaymentStatus } from "@/lib/payment/types";

/**
 * Mock MercadoPago adapter implementing IPaymentGateway.
 * Simula preferencias, IPN y estados sin credenciales reales.
 */
export class MercadoPagoMockAdapter implements IPaymentGateway {
    async createPayment(amount: number, currency: string = "USD"): Promise<PaymentResult> {
        const preferenceId = `MP-${uuidv4()}`;
        const status: PaymentStatus = this.randomStatus();
        const createdAt = new Date().toISOString();

        return {
            id: preferenceId,
            amount,
            currency,
            status,
            createdAt,
            raw: {
                preference_id: preferenceId,
                status,
                amount,
                currency,
                createdAt,
            },
        };
    }

    async capturePayment(paymentId: string): Promise<PaymentResult> {
        const status: PaymentStatus = this.randomStatus();
        const capturedAt = new Date().toISOString();

        return {
            id: paymentId,
            amount: 0,
            currency: "USD",
            status,
            createdAt: capturedAt,
            raw: {
                payment_id: paymentId,
                status,
                capturedAt,
            },
        };
    }

    async verifyWebhook(event: any): Promise<boolean> {
        const allowed = [
            "payment.created",
            "payment.succeeded",
            "payment.failed",
            "payment.pending",
        ];
        return allowed.includes(event?.event);
    }

    private randomStatus(): PaymentStatus {
        const statuses: PaymentStatus[] = ["approved", "rejected", "pending", "timeout"];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
}