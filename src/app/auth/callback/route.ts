import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

function getLocaleFromRequest(request: NextRequest): string {
  return request.cookies.get('RentNow_locale')?.value || 'es'
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const locale = getLocaleFromRequest(request);
  const next = request.nextUrl.searchParams.get('next') ?? `/${locale}/dashboard`;

  if (code) {
    const cookiesToAttach: { name: string; value: string; options?: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              cookiesToAttach.push({ name, value, options });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const response = NextResponse.redirect(`${request.nextUrl.origin}${next}`);
      cookiesToAttach.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }
  }

  return NextResponse.redirect(`${request.nextUrl.origin}/${locale}/login?error=auth-failed`);
}
