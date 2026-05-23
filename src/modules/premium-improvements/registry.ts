/**
 * 9 mejoras modulares premium — impacto en valor de venta (USD) y costo de implementación.
 * Basado en mercado Flippa/Acquire y ROI documentado en docs/9_MEJORAS_Y_VALORACION.md
 */

export type PremiumImprovementId =
  | 'payments-mp'
  | 'subscriptions-saas'
  | 'i18n-trilingual'
  | 'e-signature'
  | 'ai-predictor'
  | 'whatsapp-automation'
  | 'finance-export'
  | 'auth-enterprise'
  | 'multi-tenant-whitelabel';

export interface PremiumImprovementDefinition {
  id: PremiumImprovementId;
  order: number;
  title: string;
  description: string;
  modulePath: string;
  apiEvidence?: string;
  /** Incremento estimado al precio de venta del código (USD) */
  saleValueAddedUsd: number;
  /** Costo estimado de implementación completa (USD, ~$50/h freelance LATAM) */
  implementationCostUsd: number;
  /** Horas estimadas de desarrollo */
  implementationHours: number;
}

export const PREMIUM_IMPROVEMENTS: PremiumImprovementDefinition[] = [
  {
    id: 'payments-mp',
    order: 1,
    title: 'Pasarela Mercado Pago automatizada',
    description: 'Checkout Pro/API, webhooks firmados IPN y sincronización con Supabase.',
    modulePath: 'src/modules/payments-mp',
    apiEvidence: '/api/payments/create-preference',
    saleValueAddedUsd: 1200,
    implementationCostUsd: 800,
    implementationHours: 16,
  },
  {
    id: 'subscriptions-saas',
    order: 2,
    title: 'Suscripciones SaaS recurrentes',
    description: 'Planes, trials, cancelación y estado de suscripción por organización.',
    modulePath: 'src/modules/subscriptions-saas',
    apiEvidence: '/api/modules/subscriptions-saas/status',
    saleValueAddedUsd: 900,
    implementationCostUsd: 600,
    implementationHours: 12,
  },
  {
    id: 'i18n-trilingual',
    order: 3,
    title: 'Multi-idioma ES + EN + PT',
    description: 'next-intl, selector de idioma y mensajes localizados en landing y app.',
    modulePath: 'src/messages',
    apiEvidence: '/es /en /pt',
    saleValueAddedUsd: 900,
    implementationCostUsd: 1000,
    implementationHours: 20,
  },
  {
    id: 'e-signature',
    order: 4,
    title: 'Firma electrónica con audit trail',
    description: 'Hash SHA-256 del contrato, IP, user-agent y registro inmutable.',
    modulePath: 'src/modules/e-signature',
    apiEvidence: '/api/modules/e-signature/sign',
    saleValueAddedUsd: 750,
    implementationCostUsd: 400,
    implementationHours: 8,
  },
  {
    id: 'ai-predictor',
    order: 5,
    title: 'IA: contratos y predictor de morosidad',
    description: 'Gemini para plantillas legales y score de riesgo de cobro.',
    modulePath: 'src/modules/ai-contracts',
    apiEvidence: '/api/modules/ai-contracts/generate',
    saleValueAddedUsd: 1100,
    implementationCostUsd: 700,
    implementationHours: 14,
  },
  {
    id: 'whatsapp-automation',
    order: 6,
    title: 'WhatsApp cobros automatizados',
    description: 'Cola de recordatorios y vencidos vía bridge Baileys.',
    modulePath: 'src/modules/whatsapp-automation',
    apiEvidence: '/api/modules/whatsapp-automation/enqueue',
    saleValueAddedUsd: 650,
    implementationCostUsd: 500,
    implementationHours: 10,
  },
  {
    id: 'finance-export',
    order: 7,
    title: 'Exportación financiera Excel/PDF',
    description: 'Reportes comerciales descargables para contadores y dueños.',
    modulePath: 'src/modules/finance-export',
    apiEvidence: '/api/reports/export-excel',
    saleValueAddedUsd: 550,
    implementationCostUsd: 300,
    implementationHours: 6,
  },
  {
    id: 'auth-enterprise',
    order: 8,
    title: 'Auth enterprise (MFA + dispositivos)',
    description: 'MFA TOTP, sesiones por dispositivo y recuperación segura.',
    modulePath: 'src/modules/auth-enterprise',
    apiEvidence: '/api/modules/auth-enterprise/mfa',
    saleValueAddedUsd: 850,
    implementationCostUsd: 500,
    implementationHours: 10,
  },
  {
    id: 'multi-tenant-whitelabel',
    order: 9,
    title: 'Multi-tenant y white-label',
    description: 'Organizaciones, límites por plan, logo/colores y superadmin.',
    modulePath: 'src/modules/superadmin-tenant',
    apiEvidence: '/api/modules/superadmin-tenant/organizations',
    saleValueAddedUsd: 800,
    implementationCostUsd: 600,
    implementationHours: 12,
  },
];

/** Valor base del código sin las 9 mejoras (mercado sin tracción, mayo 2026) */
export const BASE_SALE_VALUE_USD = 6000;

export function getImprovementById(id: PremiumImprovementId) {
  return PREMIUM_IMPROVEMENTS.find((m) => m.id === id);
}
