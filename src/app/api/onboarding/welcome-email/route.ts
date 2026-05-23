import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST() {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .eq('id', user.id)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ error: 'Email no encontrado' }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ error: 'Resend no configurado' }, { status: 500 });
    }

    const roleLabel = profile.role === 'arrendador' ? 'Arrendador' : 'Inquilino';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentnow.app';

    const firstSteps = profile.role === 'arrendador'
      ? [
          { step: '1', title: 'Registra tu primera propiedad', url: `${appUrl}/properties` },
          { step: '2', title: 'Agrega un inquilino', url: `${appUrl}/dashboard/tenants` },
          { step: '3', title: 'Crea un contrato con IA', url: `${appUrl}/contracts/new` },
        ]
      : [
          { step: '1', title: 'Revisa tus contratos', url: `${appUrl}/dashboard/tenant` },
          { step: '2', title: 'Configura tus pagos', url: `${appUrl}/dashboard/payments` },
          { step: '3', title: 'Descarga tus recibos', url: `${appUrl}/dashboard/tenant/documents` },
        ];

    await resend.emails.send({
      from: 'RentNow <bienvenida@rentnow.app>',
      to: profile.email,
      subject: `¡Bienvenido a RentNow, ${profile.full_name || 'usuario'}!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #1e3a5f, #152e4a); border-radius: 16px; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; font-size: 28px; margin: 0 0 8px 0;">¡Bienvenido a RentNow!</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">Tu cuenta de ${roleLabel} está lista</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">Hola ${profile.full_name || 'usuario'},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
            Gracias por unirte a RentNow. Estamos aquí para ayudarte a gestionar tus arriendos de forma inteligente.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e3a5f;">🚀 Primeros pasos:</h3>
            ${firstSteps.map(s => `
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <span style="background: #f59e0b; color: #1e3a5f; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${s.step}</span>
                <a href="${s.url}" style="color: #1e3a5f; text-decoration: none; font-weight: 600;">${s.title}</a>
              </div>
            `).join('')}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard" style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Ir a mi Dashboard →
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              ¿Necesitas ayuda? Responde a este email o visita nuestra <a href="${appUrl}/developers" style="color: #1e3a5f;">documentación API</a>.
            </p>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 12px;">
              RentNow · Gestión Inteligente de Arrendamientos
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ error: error instanceof Error ? (error as { message?: string }).message : 'Error interno' }, { status: 500 });
  }
}
