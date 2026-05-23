import { createSupabaseServerClient } from '@/lib/supabase-server';

/** MFA TOTP nativo de Supabase Auth — enroll / verify / unenroll. */
export async function getMfaStatus(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { enrolled: false, factors: [] as { id: string; friendly_name?: string }[] };

  const totp = (data?.totp || []).filter((f) => f.status === 'verified');
  await supabase
    .from('profiles')
    .update({ mfa_enrolled: totp.length > 0 })
    .eq('id', userId);

  return {
    enrolled: totp.length > 0,
    factors: totp.map((f) => ({ id: f.id, friendly_name: f.friendly_name })),
  };
}

export async function enrollTotp() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'RentNow Authenticator',
  });
  if (error) return { ok: false as const, error: error.message };
  return {
    ok: true as const,
    factorId: data.id,
    qrCode: data.totp?.qr_code,
    secret: data.totp?.secret,
  };
}

export async function verifyTotpEnrollment(factorId: string, code: string) {
  const supabase = await createSupabaseServerClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) return { ok: false as const, error: challenge.error.message };

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  if (verify.error) return { ok: false as const, error: verify.error.message };
  return { ok: true as const };
}
