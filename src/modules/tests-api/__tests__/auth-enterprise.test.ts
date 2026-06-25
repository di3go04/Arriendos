/** Módulo 6 — tests APIs críticas (auth lockout logic) */
import { AUTH_ENTERPRISE_CONFIG } from '@/modules/auth-enterprise/config';

describe('auth-enterprise module', () => {
  it('define límites de lockout', () => {
    expect(AUTH_ENTERPRISE_CONFIG.maxAttempts).toBe(5);
    expect(AUTH_ENTERPRISE_CONFIG.lockoutMinutes).toBe(15);
  });
});
