import { createSupabaseServerClient } from '@/lib/supabase-server';

/** Recuperación robusta vía Supabase Auth (email con enlace mágico / reset). */
export async function requestPasswordReset(email: string) {
  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${appUrl}/login?recovery=1`,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  // Respuesta uniforme aunque el email no exista (anti-enumeración)
  return { ok: true as const, sent: true };
}
