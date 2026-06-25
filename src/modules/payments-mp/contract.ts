import type { ModuleResult } from '@/modules/_kernel/types';

export interface ProcessCardPaymentInput {
  planId: string;
  currency: string;
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments?: number;
}

export interface IPaymentsMpService {
  getPublicConfig(): { configured: boolean; publicKey: string | null; mode: string };
  processCardPayment(userId: string, input: ProcessCardPaymentInput): Promise<ModuleResult<{ id: string; status: string }>>;
  verifyWebhookSignature(body: string, signature: string | null, requestId: string | null): boolean;
}
