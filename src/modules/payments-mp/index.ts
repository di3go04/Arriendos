/** Módulo 2 — Mercado Pago Checkout API + webhooks */
export type { IPaymentsMpService } from './contract';
export { createPaymentsMpService } from './service';
export {
  fetchMercadoPagoOAuthToken,
  validateMercadoPagoAccessToken,
  type MercadoPagoOAuthResponse,
} from './oauth';
