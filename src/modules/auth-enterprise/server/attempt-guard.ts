import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { LoginAttemptStatus, RequestMeta } from '@/modules/_kernel/contracts';
import { AUTH_ENTERPRISE_CONFIG } from '../config';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function lockoutEnd(failures: number, oldestFailureAt: Date): Date | null {
  if (failures < AUTH_ENTERPRISE_CONFIG.maxAttempts) return null;
  return new Date(
    oldestFailureAt.getTime() + AUTH_ENTERPRISE_CONFIG.lockoutMinutes * 60 * 1000
  );
}

export async function evaluateLoginAttempts(
  email: string
): Promise<LoginAttemptStatus> {
  const admin = getSupabaseAdmin();
  const normalized = normalizeEmail(email);

  if (!admin) {
    return {
      allowed: true,
      remainingAttempts: AUTH_ENTERPRISE_CONFIG.maxAttempts,
      lockedUntil: null,
      message: 'Lockout desactivado (sin SUPABASE_SERVICE_ROLE_KEY)',
    };
  }

  const since = new Date(
    Date.now() - AUTH_ENTERPRISE_CONFIG.attemptWindowMinutes * 60 * 1000
  ).toISOString();

  const { data: rows } = await admin
    .from('auth_login_attempts')
    .select('success, created_at')
    .eq('email', normalized)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  const failures = (rows || []).filter((r) => !r.success);
  const remaining = Math.max(0, AUTH_ENTERPRISE_CONFIG.maxAttempts - failures.length);

  if (failures.length >= AUTH_ENTERPRISE_CONFIG.maxAttempts) {
    const oldest = new Date(failures[0].created_at as string);
    const until = lockoutEnd(failures.length, oldest);
    if (until && until.getTime() > Date.now()) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: until.toISOString(),
        message: `Cuenta bloqueada hasta ${until.toLocaleTimeString()}`,
      };
    }
  }

  return {
    allowed: true,
    remainingAttempts: remaining,
    lockedUntil: null,
  };
}

export async function insertLoginAttempt(
  email: string,
  success: boolean,
  meta: RequestMeta
) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  await admin.from('auth_login_attempts').insert({
    email: normalizeEmail(email),
    success,
    ip_address: meta.ip ?? null,
  });
}
