/**
 * Módulo 1 — Autenticación empresarial
 * @module auth-enterprise
 */
export { AUTH_ENTERPRISE_CONFIG } from './config';
export { createAuthEnterpriseService } from './service';
export { enrollTotp, getMfaStatus, verifyTotpEnrollment } from './server/mfa-service';
