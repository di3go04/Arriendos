import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { RequestMeta, UserDevice } from '@/modules/_kernel/contracts';

function parseDeviceName(userAgent: string | null | undefined) {
  if (!userAgent) return 'Dispositivo desconocido';
  if (/iPhone|iPad/i.test(userAgent)) return 'Apple iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Navegador web';
}

export async function upsertUserDevice(
  userId: string,
  meta: RequestMeta
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const fingerprint = meta.fingerprint?.trim();
  if (!admin || !fingerprint) return null;

  const deviceName = parseDeviceName(meta.userAgent);

  const { data, error } = await admin
    .from('auth_user_devices')
    .upsert(
      {
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: deviceName,
        user_agent: meta.userAgent ?? null,
        ip_address: meta.ip ?? null,
        last_seen_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: 'user_id,device_fingerprint' }
    )
    .select('id')
    .single();

  if (error) {
    console.error('[auth-enterprise] upsert device', error);
    return null;
  }
  return data.id as string;
}

export async function listUserDevices(
  userId: string,
  currentFingerprint?: string
): Promise<UserDevice[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data } = await admin
    .from('auth_user_devices')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('last_seen_at', { ascending: false });

  return (data || []).map((row) => ({
    id: row.id as string,
    deviceName: (row.device_name as string) || 'Dispositivo',
    userAgent: row.user_agent as string | null,
    ipAddress: row.ip_address as string | null,
    lastSeenAt: row.last_seen_at as string,
    isCurrent: currentFingerprint
      ? row.device_fingerprint === currentFingerprint
      : false,
  }));
}

export async function revokeUserDevice(userId: string, deviceId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: 'Admin no configurado' };

  const { error } = await admin
    .from('auth_user_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', deviceId)
    .eq('user_id', userId);

  return error ? { ok: false, error: error.message } : { ok: true };
}
