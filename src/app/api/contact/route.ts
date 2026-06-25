import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin'
import { resend } from '@/lib/resend'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    const errors: Record<string, string> = {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.name = 'Name is required'
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      errors.email = 'Valid email is required'
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      errors.message = 'Message is required'
    } else if (message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      console.warn('[contact] Supabase admin not configured — simulating save')
      console.log('[contact]', { name: name.trim(), email: email.trim(), message: message.trim(), created_at: new Date().toISOString() })
    } else {
      const { error } = await supabase.from('contacts').insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error('[contact] Supabase insert error:', error)
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
      }
    }

    // Enviar notificación por email
    if (resend) {
      // 1. Confirmación al usuario
      try {
        await resend.emails.send({
          from: 'RentNow <noreply@rentnow.app>',
          to: email.trim(),
          subject: 'Recibimos tu mensaje - RentNow',
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1E3A5F; margin-bottom: 16px;">¡Hola, ${name.trim()}!</h2>
              <p style="color: #4A5568; line-height: 1.5;">Gracias por ponerte en contacto con nosotros. Hemos recibido tu mensaje correctamente.</p>
              <div style="background: #F4F6F9; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #E2E8F0;">
                <p style="margin-top: 0; font-weight: bold; color: #1E3A5F;">Tu mensaje:</p>
                <p style="font-style: italic; color: #4A5568; margin-bottom: 0; white-space: pre-wrap;">"${message.trim()}"</p>
              </div>
              <p style="color: #4A5568; line-height: 1.5;">Uno de nuestros asesores revisará tu solicitud y se pondrá en contacto contigo en las próximas 24 horas.</p>
              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
              <p style="color: #718096; font-size: 12px; text-align: center;">Este es un correo automático de RentNow. Por favor no respondas directamente a este mensaje.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[contact] Error sending user confirmation email:', emailErr);
      }

      // 2. Notificación al administrador
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@rentnow.app';
        await resend.emails.send({
          from: 'RentNow Contact <noreply@rentnow.app>',
          to: adminEmail,
          subject: `Nuevo mensaje de contacto de ${name.trim()}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1E3A5F; margin-bottom: 16px;">Nuevo mensaje de contacto recibido</h2>
              <div style="background: #F4F6F9; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #E2E8F0;">
                <p style="margin-top: 0;"><strong>Nombre:</strong> ${name.trim()}</p>
                <p><strong>Email:</strong> ${email.trim()}</p>
                <p><strong>Fecha/Hora:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Mensaje:</strong></p>
                <p style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 0; white-space: pre-wrap;">${message.trim()}</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[contact] Error sending admin notification email:', emailErr);
      }
    } else {
      console.warn('[contact] Resend client not configured — simulating email sending');
      console.log('[contact] Simulating email to user:', email.trim());
      console.log('[contact] Simulating email to admin:', process.env.ADMIN_EMAIL || 'admin@rentnow.app');
    }

    return NextResponse.json({ success: true, message: 'Message processed successfully' })
  } catch (err) {
    console.error('[contact] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
