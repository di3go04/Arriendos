import { createSupabaseServerClient } from '@/lib/supabase-server';

/** MFA TOTP nativo de Supabase Auth — enroll / verify / unenroll. */
export async function getMfaStatus(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { enrolled: false, factors: [] as { id: string; friendly_name?: string }[] };

  const totp = (data?.totp || []).filter((f: { status: string }) => f.status === 'verified');
  await supabase
    .from('profiles')
    .update({ mfa_enrolled: totp.length > 0 })
    .eq('id', userId);

  return {
    enrolled: totp.length > 0,
    factors: totp.map((f: { id: string; friendly_name?: string }) => ({ id: f.id, friendly_name: f.friendly_name })),
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

export async function unenrollTotp() {
  const supabase = await createSupabaseServerClient();
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { ok: false as const, error: listError.message };

  const verified = (factors?.totp || []).filter((f: { status: string }) => f.status === 'verified');
  if (verified.length === 0) return { ok: false as const, error: 'No hay factores MFA activos' };

  for (const factor of verified) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) return { ok: false as const, error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ mfa_enrolled: false })
      .eq('id', user.id);
  }

  return { ok: true as const };
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
