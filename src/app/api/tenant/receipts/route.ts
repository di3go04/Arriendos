import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId requerido' }, { status: 400 });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*, contract:contracts(*, property:properties(*), landlord:profiles!contracts_landlord_id_fkey(*), tenant:profiles!contracts_tenant_id_fkey(*))')
      .eq('id', paymentId)
      .eq('tenant_id', user.id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    const c = payment.contract as LooseRecord;
    const prop = c?.property;
    const landlord = c?.landlord;
    const tenant = c?.tenant;

    const receiptHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Recibo de Pago</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #333; }
  h1 { color: #1e3a5f; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
  .header { text-align: center; margin-bottom: 30px; }
  .header h2 { color: #1e3a5f; margin: 0; }
  .info { margin: 20px 0; }
  .info p { margin: 5px 0; }
  .amount { font-size: 24px; font-weight: bold; color: #1e3a5f; text-align: center; margin: 20px 0; }
  .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  td:first-child { font-weight: bold; width: 40%; }
</style></head>
<body>
  <div class="header">
    <h2>RentNow</h2>
    <p style="color:#666;">Recibo de Pago</p>
  </div>
  <table>
    <tr><td>Propiedad</td><td>${prop?.title || 'N/A'}</td></tr>
    <tr><td>Dirección</td><td>${prop?.address || ''}, ${prop?.city || ''}</td></tr>
    <tr><td>Arrendador</td><td>${landlord?.full_name || 'N/A'}</td></tr>
    <tr><td>Inquilino</td><td>${tenant?.full_name || 'N/A'}</td></tr>
    <tr><td>Fecha de pago</td><td>${payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('es-CO') : '—'}</td></tr>
    <tr><td>Período</td><td>${payment.month_year || payment.due_date || '—'}</td></tr>
    <tr><td>Método de pago</td><td>${payment.payment_method || 'Efectivo'}</td></tr>
  </table>
  <div class="amount">$${Number(payment.amount).toLocaleString('es-CO')} COP</div>
  <p style="text-align:center;color:green;font-weight:bold;">✓ PAGADO</p>
  <div class="footer">
    <p>RentNow - Plataforma de Gestión de Arrendamientos</p>
    <p>Generado el ${new Date().toLocaleString('es-CO')}</p>
  </div>
</body></html>`;

    return new NextResponse(receiptHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="recibo-${paymentId.slice(0, 8)}.html"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}
