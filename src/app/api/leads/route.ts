import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function createSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore?.getAll() ?? []; },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore?.set(name, value, options));
        },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const { name, email, phone, message, propertyId, propertyTitle, ownerId } = await req.json();

    if (!name || !email || !phone || !propertyId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalido' }, { status: 400 });
    }

    const leadId = crypto.randomUUID();
    const supabase = await createSupabaseClient();

    const { error: insertError } = supabase
      ? await supabase.from('property_leads').insert({
        id: leadId,
        property_id: propertyId,
        owner_id: ownerId,
        lead_name: name,
        lead_email: email,
        lead_phone: phone,
        lead_message: message || null,
        source: 'portal_publico',
      })
      : { error: null };

    if (insertError) {
      console.error('Error guardando lead:', insertError);
    }

    if (resend && supabase) {
      const { data: owner } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', ownerId)
        .single();

      if (owner?.email) {
        await resend.emails.send({
          from: 'RentNow <noreply@rentnow.app>',
          to: owner.email,
          subject: `Nuevo lead para ${propertyTitle || 'tu propiedad'}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1E3A5F;">Nuevo interesado en tu propiedad</h2>
              <p style="color: #4A5568;">Has recibido una nueva solicitud de informacion para <strong>${propertyTitle || 'tu propiedad'}</strong>.</p>
              <div style="background: #F4F6F9; padding: 16px; border-radius: 12px; margin: 16px 0;">
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefono:</strong> ${phone}</p>
                ${message ? `<p><strong>Mensaje:</strong> ${message}</p>` : ''}
              </div>
              <p style="color: #718096; font-size: 12px;">Responde pronto para aumentar tus posibilidades de alquilar.</p>
            </div>
          `,
        });
      }
    }

    if (supabase && ownerId) {
      await supabase.from('notifications').insert({
        user_id: ownerId,
        title: 'Nuevo lead recibido',
        message: `${name} esta interesado en ${propertyTitle || 'tu propiedad'}`,
        type: 'info',
      });
    }

    return NextResponse.json({ success: true, leadId });
  } catch (error: unknown) {
    console.error('Error processing lead:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
