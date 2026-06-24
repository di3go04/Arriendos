import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let initAttempted = false;

function getClient(): SupabaseClient | null {
  if (initAttempted) return cachedClient;
  initAttempted = true;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') return null;
    throw new Error(
      'Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}

export function getSupabaseBrowser(): SupabaseClient | null {
  return getClient();
}

export const supabase = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop) {
    const client = getClient();
    if (!client) {
      if (typeof window === 'undefined') return () => null;
      throw new Error('Supabase no configurado');
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
