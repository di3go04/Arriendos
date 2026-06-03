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
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { type, contractId, propertyId } = await req.json();

    if (!type) {
      return NextResponse.json({ error: 'Tipo de documento requerido' }, { status: 400 });
    }

    // Obtener datos según el tipo de documento
    const data: LooseRecord = {};

    if (contractId) {
      const { data: contract } = await supabase
        .from('contracts')
        .select('*, property:properties(*), landlord:profiles!contracts_landlord_id_fkey(*), tenant:profiles!contracts_tenant_id_fkey(*)')
        .eq('id', contractId)
        .single();
      data.contract = contract;
    }

    if (propertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      data.property = property;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = '';
    let filename = '';

    switch (type) {
      case 'recibo_pago': {
        const payment = data.contract;
        filename = `Recibo_Pago_${payment?.contract_number || 'N/A'}.html`;
        html = `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1e3a5f; margin: 0; font-size: 24px; }
            .header p { color: #64748b; margin: 5px 0 0; }
            .section { margin-bottom: 20px; }
            .section h2 { color: #1e3a5f; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; padding: 5px 0; }
            .label { color: #64748b; font-weight: 600; }
            .value { color: #1e293b; font-weight: 700; }
            .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .badge { display: inline-block; padding: 4px 12px; background: #4d7c0f; color: white; border-radius: 20px; font-size: 12px; font-weight: 700; }
            .total { font-size: 20px; font-weight: 900; color: #1e3a5f; text-align: right; }
          </style></head><body>
            <div class="header">
              <h1>RECIBO DE PAGO</h1>
              <p>RentNow - Gestión de Arrendamientos</p>
              <p>Fecha de emisión: ${formattedDate}</p>
              <p><span class="badge">PAGADO</span></p>
            </div>
            <div class="section">
              <h2>Información del Arrendatario</h2>
              <div class="row"><span class="label">Nombre:</span><span class="value">${data.contract?.tenant?.full_name || 'N/A'}</span></div>
              <div class="row"><span class="label">Cédula:</span><span class="value">${data.contract?.tenant?.phone || 'N/A'}</span></div>
            </div>
            <div class="section">
              <h2>Información del Inmueble</h2>
              <div class="row"><span class="label">Dirección:</span><span class="value">${data.contract?.property?.address || 'N/A'}</span></div>
              <div class="row"><span class="label">Ciudad:</span><span class="value">${data.contract?.property?.city || 'N/A'}</span></div>
            </div>
            <div class="section">
              <h2>Detalle del Pago</h2>
              <div class="row"><span class="label">Período:</span><span class="value">${formattedDate}</span></div>
              <div class="row"><span class="label">Estado:</span><span class="value" style="color:#4d7c0f">Pagado</span></div>
              <div style="margin-top:15px;padding-top:15px;border-top:2px solid #e2e8f0">
                <div class="total">Total: $${(data.contract?.monthly_rent || 0).toLocaleString('es-CO')}</div>
              </div>
            </div>
            <div class="footer">
              <p>Este recibo es generado automáticamente por RentNow.</p>
              <p>Documento válido como soporte de pago.</p>
            </div>
          </body></html>
        `;
        break;
      }

      case 'certificado_arrendamiento': {
        filename = `Certificado_Arrendamiento_${data.contract?.contract_number || 'N/A'}.html`;
        html = `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1e3a5f; margin: 0; font-size: 24px; }
            .content { line-height: 1.8; }
            .firma { margin-top: 60px; display: flex; justify-content: space-between; }
            .firma div { text-align: center; width: 200px; }
            .firma hr { margin-bottom: 5px; }
            .sello { text-align: center; margin-top: 40px; }
            .sello img { width: 100px; opacity: 0.3; }
          </style></head><body>
            <div class="header">
              <h1>CERTIFICADO DE ARRENDAMIENTO</h1>
              <p>RentNow - Plataforma de Gestión</p>
              <p>Fecha de emisión: ${formattedDate}</p>
            </div>
            <div class="content">
              <p>La plataforma <strong>RentNow</strong> certifica que:</p>
              <p>El señor(a) <strong>${data.contract?.tenant?.full_name || 'N/A'}</strong>, identificado(a) con cédula de ciudadanía, tiene un contrato de arrendamiento vigente sobre el inmueble ubicado en <strong>${data.contract?.property?.address || 'N/A'}</strong>, ciudad de <strong>${data.contract?.property?.city || 'N/A'}</strong>.</p>
              <p>El valor del canon mensual es de <strong>$${(data.contract?.monthly_rent || 0).toLocaleString('es-CO')}</strong>.</p>
              <p>Período del contrato: ${data.contract?.start_date ? new Date(data.contract.start_date).toLocaleDateString('es-CO') : 'N/A'} al ${data.contract?.end_date ? new Date(data.contract.end_date).toLocaleDateString('es-CO') : 'N/A'}.</p>
              <p>El arrendatario se encuentra al día en sus obligaciones de pago.</p>
            </div>
            <div class="firma">
              <div><hr><p>Arrendador</p></div>
              <div><hr><p>Arrendatario</p></div>
            </div>
            <div class="sello">
              <p style="color:#94a3b8;font-size:12px;">Certificado generado digitalmente por RentNow</p>
              <p style="color:#94a3b8;font-size:10px;">${new Date().toISOString()}</p>
            </div>
          </body></html>
        `;
        break;
      }

      case 'inventario': {
        filename = `Inventario_${propertyId ? data.property?.title : 'Nuevo'}.html`;
        html = `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; font-weight: 700; color: #1e3a5f; }
            .firma { margin-top: 60px; display: flex; justify-content: space-between; }
            .firma div { text-align: center; width: 200px; }
            .firma hr { margin-bottom: 5px; }
          </style></head><body>
            <div class="header">
              <h1>INVENTARIO DE INMUEBLE</h1>
              <p>${data.property?.title || 'Nueva Propiedad'} - ${data.property?.address || ''}</p>
            </div>
            <table>
              <tr><th>Elemento</th><th>Estado</th><th>Cantidad</th><th>Observaciones</th></tr>
              <tr><td>Pisos</td><td>Bueno</td><td>-</td><td></td></tr>
              <tr><td>Paredes</td><td>Bueno</td><td>-</td><td></td></tr>
              <tr><td>Ventanas</td><td>Bueno</td><td>${data.property?.bedrooms ? data.property.bedrooms + 2 : '-'}</td><td></td></tr>
              <tr><td>Puertas</td><td>Bueno</td><td>${data.property?.bedrooms ? data.property.bedrooms + 2 : '-'}</td><td></td></tr>
              <tr><td>Baños</td><td>Bueno</td><td>${data.property?.bathrooms || '-'}</td><td></td></tr>
              <tr><td>Cocina</td><td>Bueno</td><td>1</td><td></td></tr>
              ${data.property?.amenities?.map((a: string) => `<tr><td>${a}</td><td>Bueno</td><td>1</td><td></td></tr>`).join('') || ''}
            </table>
            <div class="firma">
              <div><hr><p>Arrendador</p></div>
              <div><hr><p>Arrendatario</p></div>
            </div>
          </body></html>
        `;
        break;
      }

      case 'paz_y_salvo': {
        filename = `Paz_y_Salvo_${data.contract?.contract_number || 'N/A'}.html`;
        html = `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border: 3px solid #1e3a5f; padding: 20px; margin-bottom: 30px; }
            .header h1 { color: #1e3a5f; margin: 0; font-size: 28px; }
            .content { line-height: 2; }
            .firma { margin-top: 60px; display: flex; justify-content: space-between; }
            .firma div { text-align: center; width: 200px; }
            .firma hr { margin-bottom: 5px; }
          </style></head><body>
            <div class="header">
              <h1>PAZ Y SALVO</h1>
              <p>No. ${data.contract?.contract_number || 'N/A'}</p>
            </div>
            <div class="content">
              <p>El suscrito(a) <strong>${data.contract?.landlord?.full_name || 'N/A'}</strong>, identificado(a) como arrendador(a) del inmueble ubicado en <strong>${data.contract?.property?.address || 'N/A'}</strong>, certifica que:</p>
              <p>El señor(a) <strong>${data.contract?.tenant?.full_name || 'N/A'}</strong> se encuentra a paz y salvo por concepto de cánones de arrendamiento y servicios públicos del inmueble antes mencionado, hasta la fecha de expedición del presente documento.</p>
              <p>Se expide el presente Paz y Salvo a solicitud del interesado(a), para los fines que estime convenientes.</p>
              <p style="margin-top:30px;font-size:14px;color:#64748b;">Fecha de expedición: ${formattedDate}</p>
            </div>
            <div class="firma">
              <div><hr><p>Arrendador</p></div>
            </div>
          </body></html>
        `;
        break;
      }

      default:
        return NextResponse.json({ error: 'Tipo de documento no soportado' }, { status: 400 });
    }

    return NextResponse.json({ html, filename, type });
  } catch (error: unknown) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}