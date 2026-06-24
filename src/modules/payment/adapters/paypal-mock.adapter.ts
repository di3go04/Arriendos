import { v4 as uuidv4 } from "uuid";
import { IPaymentGateway, PaymentResult, PaymentStatus } from "@/lib/payment/types";

/**
 * Mock PayPal adapter implementing IPaymentGateway.
 * Simulates realistic responses without external credentials.
 */
export class PayPalMockAdapter implements IPaymentGateway {
    async createPayment(amount: number, currency: string = "USD"): Promise<PaymentResult> {
        const id = `PAY-${uuidv4()}`;
        const status: PaymentStatus = this.randomStatus();
        const createdAt = new Date().toISOString();

        return {
            id,
            amount,
            currency,
            status,
            createdAt,
            raw: {
                id,
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
            amount: 0, // amount not relevant for mock capture
            currency: "USD",
            status,
            createdAt: capturedAt,
            raw: {
                id: paymentId,
                status,
                capturedAt,
            },
        };
    }

    async verifyWebhook(event: Record<string, unknown>): Promise<boolean> {
        // Accept any event that contains a known PayPal webhook type
        const allowed = [
            "PAYMENT.CAPTURE.COMPLETED",
            "PAYMENT.CAPTURE.DENIED",
            "PAYMENT.CAPTURE.PENDING",
        ];
        return allowed.includes((event as Record<string, unknown>)?.event_type as string);
    }

    private randomStatus(): PaymentStatus {
        const statuses: PaymentStatus[] = ["approved", "rejected", "pending", "timeout"];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
}