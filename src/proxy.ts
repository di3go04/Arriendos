import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user session securely from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Protect routes: only allow authenticated users to access dashboard, admin, contracts, properties, and templates routes
  if (
    !user &&
    (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/contracts') ||
      pathname.startsWith('/properties') ||
      pathname.startsWith('/templates'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Redirect logged-in users away from auth pages (/login, /register)
  if (
    user &&
    (pathname === '/login' || pathname === '/register')
  ) {
    // Determine the role and redirect accordingly
    const role = user.user_metadata?.role || 'arrendatario';
    const url = request.nextUrl.clone();
    if (role === 'admin') {
      url.pathname = '/admin';
    } else if (role === 'arrendador') {
      url.pathname = '/dashboard/landlord';
    } else {
      url.pathname = '/dashboard/tenant';
    }
    return NextResponse.redirect(url);
  }

  // 3. Prevent tenants from accessing landlord-only routes and vice-versa
  if (user) {
    const role = user.user_metadata?.role || 'arrendatario';
    const url = request.nextUrl.clone();

    // If role is tenant, block access to landlord dashboard, admin, properties, and templates
    if (role === 'arrendatario') {
      if (
        pathname.startsWith('/dashboard/landlord') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/properties') ||
        pathname.startsWith('/templates')
      ) {
        url.pathname = '/dashboard/tenant';
        return NextResponse.redirect(url);
      }
    }

    // If role is landlord, block access to tenant dashboard and admin
    if (role === 'arrendador') {
      if (pathname.startsWith('/dashboard/tenant') || pathname.startsWith('/admin')) {
        url.pathname = '/dashboard/landlord';
        return NextResponse.redirect(url);
      }
    }

    // If role is admin, redirect them to admin page if they try to access dashboards
    if (role === 'admin') {
      if (pathname.startsWith('/dashboard/landlord') || pathname.startsWith('/dashboard/tenant')) {
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
