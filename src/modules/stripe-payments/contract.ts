import type Stripe from 'stripe';

export type CheckoutMode = 'payment' | 'subscription';

export interface CreateCheckoutInput {
  mode: CheckoutMode;
  customerEmail: string;
  productName: string;
  /** Monto en dólares USD (ej. 12.99). Se convierte a centavos para Stripe. */
  amountUsd?: number;
  /** Monto en centavos USD (ej. 2900 = $29.00). Prioridad si se envía. */
  priceInCents?: number;
  /** Alias de productName */
  planName?: string;
  planId?: string;
  userId?: string;
  /** Price ID fijo de Stripe (opcional; prioridad sobre amountUsd en subscription) */
  priceId?: string;
  billingInterval?: 'month' | 'year';
  quantity?: number;
  successPath?: string;
  cancelPath?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutResult {
  ok: true;
  sessionId: string;
  url: string | null;
  mode: StripeRuntimeModeLabel;
}

export type StripeRuntimeModeLabel = 'test' | 'live' | 'unset';

export interface WebhookHandleResult {
  ok: boolean;
  eventType?: string;
  error?: string;
}

export type { Stripe };
