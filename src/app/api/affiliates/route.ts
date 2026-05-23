import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Mock response for Affiliate data
    const affiliateCode = crypto.createHash('md5').update(user.id).digest('hex').substring(0, 8).toUpperCase();
    const referralLink = `https://rentnow.app/register?ref=${affiliateCode}`;

    return NextResponse.json({ 
      affiliateCode,
      referralLink,
      stats: {
        clicks: 142,
        signups: 12,
        activeSubscriptions: 3,
        earningsPending: 45.00,
        earningsPaid: 120.00
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
