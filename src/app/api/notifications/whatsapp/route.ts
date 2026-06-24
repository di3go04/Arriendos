import { sendWhatsAppViaBridge } from '@/lib/whatsapp';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { phone, message, type } = await req.json();
    if (!phone || !message) {
      return NextResponse.json({ error: 'phone y message requeridos' }, { status: 400 });
    }

    const result = await sendWhatsAppViaBridge(phone, message);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          hint: 'Inicia el bridge: npm run whatsapp:bridge (y escanea el QR la primera vez)',
        },
        { status: 503 }
      );
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: `WhatsApp ${type || 'enviado'}`,
      message: `Mensaje enviado a ${phone}`,
      type: type || 'info',
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
