import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type GuardResult =
  | { user: User; supabase: SupabaseClient }
  | { error: NextResponse };

/**
 * Validates that the request comes from an authenticated admin user.
 * Checks the session AND verifies profile.role === 'admin'.
 *
 * Usage in API Routes:
 *   const auth = await validateAdminRole();
 *   if ('error' in auth) return auth.error;
 *
 * Usage in Server Components / Server Actions:
 *   const auth = await validateAdminRole();
 *   if ('error' in auth) throw new Error('Unauthorized');
 *   const { user } = auth;
 */
export async function validateAdminRole(): Promise<GuardResult> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acceso denegado: se requiere rol de administrador' }, { status: 403 }) };
  }

  return { user, supabase };
}
