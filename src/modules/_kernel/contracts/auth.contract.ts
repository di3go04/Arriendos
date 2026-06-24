import type { ModuleResult, RequestMeta } from '../types';

export interface LoginAttemptStatus {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: string | null;
  message?: string;
}

export interface UserDevice {
  id: string;
  deviceName: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastSeenAt: string;
  isCurrent: boolean;
}

export interface IAuthEnterpriseService {
  checkLoginAllowed(email: string, meta: RequestMeta): Promise<ModuleResult<LoginAttemptStatus>>;
  recordLoginFailure(email: string, meta: RequestMeta): Promise<ModuleResult<LoginAttemptStatus>>;
  recordLoginSuccess(userId: string, meta: RequestMeta): Promise<ModuleResult<{ deviceId: string }>>;
  listDevices(userId: string, currentFingerprint?: string): Promise<ModuleResult<UserDevice[]>>;
  revokeDevice(userId: string, deviceId: string): Promise<ModuleResult<void>>;
  requestPasswordReset(email: string): Promise<ModuleResult<{ sent: boolean }>>;
}
