import { sendWhatsAppViaBridge } from '@/lib/whatsapp';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, message, templateName } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Falta parámetro: to (número)' }, { status: 400 });
    }

    const texto =
      message ||
      (templateName ? `[Plantilla: ${templateName}]` : null);

    if (!texto) {
      return NextResponse.json({ error: 'Falta message o templateName' }, { status: 400 });
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await sendWhatsAppViaBridge(to, texto);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message || 'No se pudo enviar por WhatsApp',
          hint: 'Ejecuta en otra terminal: npm run whatsapp:bridge y escanea el QR',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje de WhatsApp enviado correctamente',
      status: 'sent',
      to,
      provider: result.provider,
    });
  } catch (error: unknown) {
    console.error('WhatsApp API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
