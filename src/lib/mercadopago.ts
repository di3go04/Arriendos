import crypto from 'crypto';
import MercadoPagoConfig, { Payment, PreApproval, Preference } from 'mercadopago';

/**
 * Cliente de Mercado Pago configurado con Access Token.
 */
export function getMercadoPagoAccessToken() {
  return (
    process.env.MP_ACCESS_TOKEN?.trim() ||
    process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ||
    ''
  );
}

export const mercadopagoClient = new MercadoPagoConfig({
  accessToken: getMercadoPagoAccessToken(),
  options: { timeout: 10000, idempotencyKey: 'rentnow' },
});

/**
 * Monedas que no usan decimales (COP, CLP, ARS)
 */
const noDecimalCurrencies = ['COP', 'CLP', 'ARS'];

function toUnitAmount(amount: number, currency: string): number {
  return noDecimalCurrencies.includes(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}

/**
 * Verifica la firma de un webhook de Mercado Pago (IPN).
 * Valida el header X-Signature contra el cuerpo de la solicitud.
 */
export function verifyWebhookSignature(
  _body: string,
  xSignature: string | null,
  xRequestId: string | null
): boolean {
  if (!xSignature || !xRequestId) return false;

  try {
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) return false;

    const secret = process.env.MP_WEBHOOK_SECRET || '';
    const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`;
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  } catch {
    return false;
  }
}

/**
 * Crea una preferencia de pago para pago único (Checkout Pro)
 */
export async function createPaymentPreference(params: {
  planId: string;
  planName: string;
  planDescription: string;
  amount: number;
  currency: string;
  payerEmail?: string;
  payerName?: string;
  userId: string;
  returnUrl: string;
  webhookUrl: string;
}) {
  const {
    planId, planName, planDescription, amount, currency,
    payerEmail, payerName, userId, returnUrl, webhookUrl,
  } = params;

  const preference = new Preference(mercadopagoClient);

  const body = {
    items: [
      {
        id: `plan-${planId}-${Date.now()}`,
        title: `RentNow - ${planName}`,
        description: planDescription,
        quantity: 1,
        currency_id: currency.toUpperCase(),
        unit_price: toUnitAmount(amount, currency),
      },
    ],
    payer: {
      email: payerEmail || '',
      name: payerName || '',
    },
    external_reference: JSON.stringify({
      userId,
      planId,
      type: 'payment',
    }),
    notification_url: webhookUrl,
    back_urls: {
      success: `${returnUrl}?mp_success=true`,
      failure: `${returnUrl}?mp_failure=true`,
      pending: `${returnUrl}?mp_pending=true`,
    },
    auto_return: 'approved',
    binary_mode: false,
  };

  const result = await preference.create({ body });
  return result;
}

/**
 * Crea una suscripción recurrente (PreApproval) en Mercado Pago.
 * El usuario autoriza el cobro automático mensual.
 */
export async function createSubscriptionPreApproval(params: {
  planName: string;
  planDescription: string;
  amount: number;
  currency: string;
  payerEmail: string;
  userId: string;
  returnUrl: string;
  webhookUrl: string;
  frequency: number;
  frequencyType: string;
}) {
  const {
    planName, amount, currency,
    payerEmail, userId, returnUrl, webhookUrl,
    frequency, frequencyType,
  } = params;

  const preapproval = new PreApproval(mercadopagoClient);

  const body = {
    reason: `RentNow - Plan ${planName}`,
    auto_recurring: {
      frequency,
      frequency_type: frequencyType,
      transaction_amount: toUnitAmount(amount, currency),
      currency_id: currency.toUpperCase(),
    },
    payer_email: payerEmail,
    back_url: returnUrl,
    external_reference: JSON.stringify({
      userId,
      planId: planName.toLowerCase(),
      type: 'preapproval',
    }),
    notification_url: webhookUrl,
  };

  const result = await preapproval.create({ body });
  return result;
}

/**
 * Obtiene el estado de una suscripción (PreApproval) por ID
 */
export async function getPreApprovalStatus(preApprovalId: string) {
  const preapproval = new PreApproval(mercadopagoClient);
  const result = await preapproval.get({ id: preApprovalId });
  return result;
}

/**
 * Checkout API: cobro con token de tarjeta (sin redirección a Mercado Pago).
 * @see https://www.mercadopago.com.co/developers/es/docs/checkout-api-payments/overview
 */
export async function createCardPayment(params: {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  amount: number;
  currency: string;
  description: string;
  payerEmail: string;
  payerIdentification?: { type: string; number: string };
  externalReference: string;
  notificationUrl: string;
}) {
  const payment = new Payment(mercadopagoClient);

  const issuerId = params.issuerId ? Number(params.issuerId) : undefined;

  const body = {
    transaction_amount: toUnitAmount(params.amount, params.currency),
    token: params.token,
    description: params.description,
    installments: params.installments,
    payment_method_id: params.paymentMethodId,
    ...(issuerId && !Number.isNaN(issuerId) ? { issuer_id: issuerId } : {}),
    payer: {
      email: params.payerEmail,
      identification: params.payerIdentification,
    },
    external_reference: params.externalReference,
    notification_url: params.notificationUrl,
  };

  return payment.create({ body });
}

export function isMercadoPagoConfigured() {
  return Boolean(getMercadoPagoAccessToken());
}

export function getMercadoPagoPublicKey() {
  return process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '';
}
