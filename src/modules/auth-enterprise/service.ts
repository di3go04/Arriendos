import type {
  IAuthEnterpriseService,
  LoginAttemptStatus,
  RequestMeta,
  UserDevice,
} from '@/modules/_kernel/contracts';
import type { ModuleResult } from '@/modules/_kernel/types';
import {
  evaluateLoginAttempts,
  insertLoginAttempt,
} from './server/attempt-guard';
import {
  listUserDevices,
  revokeUserDevice,
  upsertUserDevice,
} from './server/device-sessions';
import { requestPasswordReset } from './server/password-recovery';

function wrap<T>(fn: () => Promise<T>): Promise<ModuleResult<T>> {
  return fn()
    .then((data) => ({ ok: true, data }))
    .catch((e: Error) => ({ ok: false, error: e.message }));
}

/** Factory pública del módulo — único punto de entrada server-side. */
export function createAuthEnterpriseService(): IAuthEnterpriseService {
  return {
    async checkLoginAllowed(email, meta) {
      void meta;
      const status = await evaluateLoginAttempts(email);
      return { ok: true, data: status };
    },

    async recordLoginFailure(email, meta) {
      await insertLoginAttempt(email, false, meta);
      const status = await evaluateLoginAttempts(email);
      return { ok: true, data: status };
    },

    async recordLoginSuccess(userId, meta) {
      const emailKey = meta.email?.trim() || `uid:${userId}`;
      await insertLoginAttempt(emailKey, true, meta);
      const deviceId = (await upsertUserDevice(userId, meta)) || '';
      return { ok: true, data: { deviceId } };
    },

    async listDevices(userId, currentFingerprint) {
      return wrap(() => listUserDevices(userId, currentFingerprint));
    },

    async revokeDevice(userId, deviceId) {
      const result = await revokeUserDevice(userId, deviceId);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, data: undefined };
    },

    async requestPasswordReset(email) {
      const result = await requestPasswordReset(email);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, data: { sent: result.sent } };
    },
  };
}

export type { LoginAttemptStatus, UserDevice };
