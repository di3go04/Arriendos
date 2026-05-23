/**
 * Registro central de módulos — importar factories desde aquí.
 */
export { createAuthEnterpriseService } from './auth-enterprise';
export { createPaymentsMpService } from './payments-mp';
export { createSubscriptionsSaasService } from './subscriptions-saas';
export { createSuperadminTenantService } from './superadmin-tenant';
export { createWhatsappAutomationService } from './whatsapp-automation';
export { recordSignature, hashContractContent } from './e-signature/service';
export { generateContractFromTemplate } from './ai-contracts/service';
export { buildLocalizedMetadata } from './seo-advanced/metadata-builder';
export { registerProductionPWA } from './pwa-prod/register-sw';
export { buildFinancialExportUrl } from './finance-export/service';
export {
  PREMIUM_IMPROVEMENTS,
  BASE_SALE_VALUE_USD,
  computePremiumValuation,
} from './premium-improvements';
export {
  createStripeCheckoutSession,
  handleStripeWebhook,
  loadSystemStripeConfig,
  isStripeConfiguredAsync,
  upsertSystemStripeConfig,
} from './stripe-payments';
