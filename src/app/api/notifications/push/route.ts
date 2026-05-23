import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:dev@rentnow.app',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}
export async function POST(req: Request) {
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

    const { subscription } = await req.json();
    if (!subscription) {
      return NextResponse.json({ error: 'Suscripción requerida' }, { status: 400 });
    }

    // Guardar suscripción push en la base de datos
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      subscription_json: JSON.stringify(subscription),
      endpoint: subscription.endpoint,
      user_agent: req.headers.get('user-agent') || '',
    }, { onConflict: 'user_id,endpoint' });

    if (error) {
      console.error('Error guardando suscripción push:', error);
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error registering push:', error);
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}

// Obtener suscripciones push de un usuario
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

    const { data } = await supabase
      .from('push_subscriptions')
      .select('subscription_json')
      .eq('user_id', user.id);

    return NextResponse.json({ subscriptions: data?.map(s => JSON.parse(s.subscription_json)) || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}

// Enviar notificación push a un usuario específico
export async function PUT(req: Request) {
  try {
    const { userId, title, body, url } = await req.json();
    if (!userId || !title) {
      return NextResponse.json({ error: 'userId y title requeridos' }, { status: 400 });
    }

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

    // Guardar notificación in-app
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message: body || '',
      type: url ? 'info' : 'success',
    });

    // Enviar Web Push real si hay VAPID configurado
    if (vapidKeys.publicKey && vapidKeys.privateKey) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('subscription_json')
        .eq('user_id', userId);

      const payload = JSON.stringify({ title, body: body || '', url: url || '/dashboard' });

      for (const s of subs || []) {
        try {
          const sub = JSON.parse(s.subscription_json);
          await webpush.sendNotification(sub, payload);
        } catch {
          // Subscription expirada o inválida, continuar
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}
