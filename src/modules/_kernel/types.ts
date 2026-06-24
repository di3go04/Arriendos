/** Identificadores estables de módulos (trazabilidad en logs y métricas). */
export type ModuleId =
  | 'auth-enterprise'
  | 'payments-mp'
  | 'subscriptions-saas'
  | 'superadmin-tenant'
  | 'e2e-ci'
  | 'tests-api'
  | 'docs-dev'
  | 'openapi-devportal'
  | 'seo-advanced'
  | 'pwa-prod'
  | 'design-system'
  | 'performance'
  | 'cicd-platform'
  | 'docker-deploy'
  | 'e-signature'
  | 'ai-contracts'
  | 'whatsapp-automation'
  | 'finance-export'
  | 'security-compliance'
  | 'commercial-kit';

export interface ModuleResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
  fingerprint?: string | null;
  email?: string | null;
}
