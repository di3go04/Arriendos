/** Módulo 1 — límites de bloqueo por intentos fallidos */
export const AUTH_ENTERPRISE_CONFIG = {
  maxAttempts: 5,
  lockoutMinutes: 15,
  attemptWindowMinutes: 30,
  moduleId: 'auth-enterprise' as const,
};
