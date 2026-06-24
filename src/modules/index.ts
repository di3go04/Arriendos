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
export { registerProductionPWA } from '@/lib/pwa-register';
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

export { createOpenBankingService } from './open-banking/service';
export { createKycService } from './kyc/service';
export { createReasService } from './reas-service/service';
export { createVoiceAgentsService } from './voice-agents/service';
export { createDashboardAlertsService } from './dashboard-alerts/service';
export { runAlertWorker } from './dashboard-alerts/worker';

export { createVirtualToursService } from './virtual-tours/service';
export { createEsgService } from './esg-sustainability/service';
export { createMarketingService } from './ai-marketing/service';
export { createRecommendationsService } from './recommendations/service';
export { createDynamicPricingService } from './dynamic-pricing/service';
export { createReconciliationService } from './reconciliation/service';
