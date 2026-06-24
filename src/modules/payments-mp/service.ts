import {
  createCardPayment,
  getMercadoPagoPublicKey,
  isMercadoPagoConfigured,
  verifyWebhookSignature,
} from '@/lib/mercadopago';
import { PRICING } from '@/config/payments';
import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { IPaymentsMpService } from './contract';

export function createPaymentsMpService(): IPaymentsMpService {
  return {
    getPublicConfig() {
      const configured = isMercadoPagoConfigured();
      const publicKey = getMercadoPagoPublicKey();
      return {
        configured,
        publicKey: publicKey || null,
        mode: publicKey && configured ? 'checkout_api' : configured ? 'checkout_pro' : 'disabled',
      };
    },

    async processCardPayment(userId, input) {
      try {
        const plan = PRICING[input.planId];
        if (!plan) return { ok: false, error: 'Plan inválido' };
        const amount = plan.prices[input.currency];
        if (!amount) return { ok: false, error: 'Moneda no soportada' };

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const payment = await createCardPayment({
          token: input.token,
          paymentMethodId: input.paymentMethodId,
          issuerId: input.issuerId,
          installments: input.installments || 1,
          amount,
          currency: input.currency,
          description: `RentNow - ${plan.name}`,
          payerEmail: '',
          externalReference: JSON.stringify({ userId, planId: input.planId }),
          notificationUrl: `${appUrl}/api/payments/webhook-mp`,
        });

        const admin = getSupabaseAdmin();
        if (admin) {
          await admin.from('payment_transactions').insert({
            user_id: userId,
            plan_id: input.planId,
            amount,
            currency: input.currency,
            mp_payment_id: String(payment.id),
            status: payment.status === 'approved' ? 'approved' : 'pending',
            mp_status: payment.status,
          });
        }

        return { ok: true, data: { id: String(payment.id), status: payment.status || 'pending' } };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Error MP' };
      }
    },

    verifyWebhookSignature(body, signature, requestId) {
      return verifyWebhookSignature(body, signature, requestId);
    },
  };
}
