import { IPaymentGateway, PaymentResult } from "@/lib/payment/types";

const API_URL = "https://api.lemonsqueezy.com/v1";

export class LemonSqueezyAdapter implements IPaymentGateway {
    private apiKey: string;
    private storeId: string;

    constructor(apiKey: string, storeId: string) {
        this.apiKey = apiKey;
        this.storeId = storeId;
    }

    async createPayment(amount: number, currency: string = "USD"): Promise<PaymentResult> {
        const res = await fetch(`${API_URL}/checkouts`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                data: {
                    type: "checkouts",
                    attributes: {
                        store_id: this.storeId,
                        variant_id: 0,
                        custom_price: amount * 100,
                        product_options: { enabled_variants: [] },
                        checkout_options: {},
                    },
                },
            }),
        });
        const json = await res.json();
        return {
            id: json.data?.id || "mock_lemon_id",
            amount,
            currency,
            status: json.data?.attributes?.status === "paid" ? "approved" : "pending",
            createdAt: new Date().toISOString(),
            raw: json,
        };
    }

    async capturePayment(paymentId: string): Promise<PaymentResult> {
        return {
            id: paymentId,
            amount: 0,
            currency: "USD",
            status: "approved",
            createdAt: new Date().toISOString(),
            raw: {},
        };
    }

    async verifyWebhook(): Promise<boolean> {
        return true;
    }
}
