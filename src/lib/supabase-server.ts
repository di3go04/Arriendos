import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

let supabaseClient: ReturnType<typeof createServerClient> | null = null;

// Existing single-instance helpers:

export async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const cookieStore = await cookies();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
  return supabaseClient;
}

export async function getAuthUser(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[auth] getUser error:', error);
    return null;
  }
  return user;
}

// Backward‑compatible aliases:
export const createSupabaseServerClient = getSupabase;
