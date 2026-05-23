import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getSystemConfigRowForAdmin,
  maskSecret,
  upsertSystemStripeConfig,
} from '@/modules/stripe-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
  }

  return { user };
}

const updateSchema = z.object({
  stripe_secret_key: z.string().min(10),
  stripe_webhook_secret: z.string().min(10),
  next_public_site_url: z.string().url(),
  stripe_publishable_key: z.string().optional().nullable(),
});

/** GET — estado de configuración (secretos enmascarados) */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const { row, effective } = await getSystemConfigRowForAdmin();

    return NextResponse.json({
      configured: Boolean(effective?.stripeSecretKey),
      source: effective?.source ?? null,
      siteUrl: row?.next_public_site_url ?? effective?.siteUrl ?? null,
      stripeSecretKeyPreview: maskSecret(row?.stripe_secret_key ?? effective?.stripeSecretKey),
      stripeWebhookSecretPreview: maskSecret(
        row?.stripe_webhook_secret ?? effective?.stripeWebhookSecret
      ),
      stripePublishableKeyPreview: maskSecret(
        row?.stripe_publishable_key ?? effective?.stripePublishableKey,
        6
      ),
      hasDatabaseRow: Boolean(row),
      updatedAt: row?.updated_at ?? null,
      table: 'configuracion_sistema',
    });
  } catch (error: unknown) {
    console.error('[GET /api/admin/system-config]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

/** PUT — guardar credenciales Stripe del dueño del SaaS */
export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const saved = await upsertSystemStripeConfig(parsed.data, auth.user!.id);

    return NextResponse.json({
      ok: true,
      message: 'Configuración guardada en configuracion_sistema',
      id: saved.id,
      next_public_site_url: saved.next_public_site_url,
      updated_at: saved.updated_at,
    });
  } catch (error: unknown) {
    console.error('[PUT /api/admin/system-config]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar' },
      { status: 500 }
    );
  }
}
