import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from = 'Rentnow <noreply@rentnow.app>' }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en sendEmail:', error);
    return { success: false, error };
  }
}

export async function sendPaymentReminder(
  tenantEmail: string,
  tenantName: string,
  propertyAddress: string,
  propertyCity: string,
  amount: number,
  dueDate: string,
  paymentId: string
) {
  const subject = `Recordatorio de pago de renta - ${propertyAddress}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1E3A5F;">Recordatorio de Pago</h2>
      <p>Hola ${tenantName},</p>
      <p>Te recordamos que tu pago de renta vence pronto:</p>
      <ul>
        <li><strong>Propiedad:</strong> ${propertyAddress}, ${propertyCity}</li>
        <li><strong>Monto:</strong> $${amount.toLocaleString()}</li>
        <li><strong>Fecha límite:</strong> ${dueDate}</li>
      </ul>
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?payment=${paymentId}" 
           style="background-color: #1E3A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
          Realizar Pago
        </a>
      </p>
      <p style="margin-top: 20px; color: #64748b; font-size: 12px;">
        Si ya realizaste el pago, puedes Ignonar este mensaje.
      </p>
    </div>
  `;

  return sendEmail({ to: tenantEmail, subject, html });
}

export async function sendNewTenantNotification(
  landlordEmail: string,
  landlordName: string,
  tenantName: string,
  propertyAddress: string
) {
  const subject = 'Nuevo arrendatario registrado';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1E3A5F;">Nuevo Arrendatario</h2>
      <p>Hola ${landlordName},</p>
      <p>Se ha registrado un nuevo arrendatario para tu propiedad:</p>
      <ul>
        <li><strong>Nombre:</strong> ${tenantName}</li>
        <li><strong>Propiedad:</strong> ${propertyAddress}</li>
      </ul>
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tenants" 
           style="background-color: #1E3A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
          Ver Detalles
        </a>
      </p>
    </div>
  `;

  return sendEmail({ to: landlordEmail, subject, html });
}
