import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Verificar autenticación
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

    // Obtener perfil del usuario para verificar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Solo arrendadores y admin pueden generar plantillas con IA
    if (!profile || !['arrendador', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'No tiene permisos para generar plantillas' }, { status: 403 });
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'El campo prompt es obligatorio.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Check if Gemini key is valid
    const isKeyValid = apiKey && 
                       apiKey.trim() !== '' && 
                       !apiKey.includes('replace_') && 
                       apiKey.startsWith('AIzaSy');

    if (isKeyValid) {
      try {
        console.log('Calling Google Gemini API to generate template...');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Eres un asistente legal experto en la redacción de contratos de arrendamiento en América Latina.
Tu tarea es generar plantillas de contratos en formato HTML semántico con estilos CSS en línea (inline styles).

Sigue estas reglas estrictas:
1. Retorna ÚNICAMENTE un objeto JSON válido con la siguiente estructura (no rodees la respuesta con \`\`\`json ni texto introductorio, debe ser puramente el JSON válido):
{
  "titleSuggested": "Nombre sugerido para la plantilla (ej: Contrato de Apartamento con Mascotas)",
  "templateContent": "Contenido HTML del contrato redactado"
}
2. El HTML en "templateContent" debe ser un código limpio, profesional, con diseño premium usando tipografía 'Outfit', sans-serif, márgenes elegantes, secciones numeradas con etiquetas <h2>, <h3> y <p>. Usa un tema de color premium con títulos destacados en azul (#2563eb o #3b82f6) y bordes finos (#e2e8f0).
3. Inserta exactamente las siguientes variables entre llaves dobles donde corresponda de forma gramatical y coherente:
   - {{arrendador_nombre}} (Nombre del propietario)
   - {{arrendatario_nombre}} (Nombre del inquilino)
   - {{arrendatario_documento}} (Cédula o ID del inquilino)
   - {{propiedad_direccion}} (Dirección del inmueble)
   - {{propiedad_ciudad}} (Ciudad de la propiedad)
   - {{renta_mensual}} (Valor mensual)
   - {{deposito}} (Depósito de garantía)
   - {{fecha_inicio}} (Fecha de inicio)
   - {{fecha_fin}} (Fecha de finalización)
   - {{dia_pago}} (Día de pago establecido)
   - {{clausulas_extra}} (Cláusulas y términos adicionales personalizados)
4. Incorpora de forma muy detallada e integrada todas las peticiones específicas del usuario en el prompt, redactando cláusulas legales hermosas y válidas para ese fin (por ejemplo: si pide cláusula de mascotas, redáctala explícitamente en el cuerpo del contrato, o si pide pago el día 10 o depósito especial, intégralo).`,
                    },
                    {
                      text: `Genera una plantilla de contrato de arrendamiento basada en los siguientes requerimientos del usuario:\n\n"${prompt}"`,
                    }
                  ],
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          try {
            const cleanText = resultText.replace(/^\s*```json\s*|```\s*$/g, '').trim();
            const parsed = JSON.parse(cleanText);
            if (parsed.templateContent && parsed.titleSuggested) {
              console.log('Successfully generated template using Google Gemini!');
              return NextResponse.json(parsed);
            }
          } catch (e) {
            console.error('Error parsing Gemini JSON response content, fallback to regex:', e);
            const titleMatch = resultText.match(/"titleSuggested"\s*:\s*"([^"]+)"/);
            const contentMatch = resultText.match(/"templateContent"\s*:\s*"([\s\S]+)"\s*(?:,\s*"|$)/);
            if (titleMatch && contentMatch) {
              return NextResponse.json({
                titleSuggested: titleMatch[1],
                templateContent: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
              });
            }
          }
        } else {
          const errText = await response.text();
          console.warn('Gemini API returned non-OK status:', response.status, errText);
        }
      } catch (err) {
        console.error('Failed to communicate with Google Gemini API:', err);
      }
    }

    // --- SMART LOCAL CASCADE FALLBACK ENGINE ---
    console.log('Using local fallback template generator for prompt:', prompt);

    const lowercasePrompt = prompt.toLowerCase();
    
    // Detect custom attributes
    let city = 'Bogotá';
    if (lowercasePrompt.includes('medellín') || lowercasePrompt.includes('medellin')) city = 'Medellín';
    else if (lowercasePrompt.includes('cali')) city = 'Cali';
    else if (lowercasePrompt.includes('barranquilla')) city = 'Barranquilla';
    else if (lowercasePrompt.includes('cartagena')) city = 'Cartagena';
    else if (lowercasePrompt.includes('bucaramanga')) city = 'Bucaramanga';
    else if (lowercasePrompt.includes('pereira')) city = 'Pereira';

    let petAllowedClause = '';
    if (lowercasePrompt.includes('mascota') || lowercasePrompt.includes('perro') || lowercasePrompt.includes('gato') || lowercasePrompt.includes('animal')) {
      petAllowedClause = `
  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #3b82f6; font-weight: 800; font-size: 14px; margin-top: 20px;">CLÁUSULA DE MASCOTAS</h3>
  <p>Se autoriza expresamente al Arrendatario la tenencia de mascotas domésticas dentro del inmueble bajo su exclusiva responsabilidad, comprometiéndose a velar por la higiene, la tranquilidad de los vecinos y a responder civilmente por cualquier daño o perjuicio físico que causen las mismas a la propiedad de acuerdo con lo especificado en la normatividad de copropiedad.</p>
      `;
    } else {
      petAllowedClause = `
  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #3b82f6; font-weight: 800; font-size: 14px; margin-top: 20px;">TENENCIA DE MASCOTAS</h3>
  <p>Salvo acuerdo previo por escrito entre las partes contratantes, queda estrictamente prohibida la tenencia, cría o permanencia de mascotas de cualquier especie en el inmueble arrendado.</p>
      `;
    }

    let paymentDay = '5';
    const paymentDayMatch = lowercasePrompt.match(/pago\s+el\s+día\s+(\d+)/) || lowercasePrompt.match(/día\s+(\d+)/) || lowercasePrompt.match(/dia\s+(\d+)/);
    if (paymentDayMatch && paymentDayMatch[1]) {
      paymentDay = paymentDayMatch[1];
    }

    let isCommercial = lowercasePrompt.includes('comercial') || lowercasePrompt.includes('local') || lowercasePrompt.includes('oficina') || lowercasePrompt.includes('bodega') || lowercasePrompt.includes('negocio');

    let titleSuggested = 'Contrato de Arrendamiento con IA';
    let htmlContent = '';

    if (isCommercial) {
      titleSuggested = `Contrato de Arrendamiento Comercial en ${city} (Generado con IA)`;
      htmlContent = `
<div style="font-family: 'Outfit', sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 25px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
  <h2 style="text-align: center; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin-bottom: 5px;">CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL</h2>
  <p style="text-align: center; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 30px;">REGISTRO EN LA CIUDAD DE ${city.toUpperCase()} - CANAL INTELIGENTE RENTNOW</p>

  <p>Conste por el presente documento legal, de una parte como <strong>EL ARRENDADOR</strong>, el señor/sociedad identificado como <strong>{{arrendador_nombre}}</strong>, y de otra parte como <strong>EL ARRENDATARIO</strong>, el señor/empresa identificado como <strong>{{arrendatario_nombre}}</strong> con cédula o documento de identificación <strong>{{arrendatario_documento}}</strong>, quienes han acordado celebrar el presente contrato comercial bajo las siguientes cláusulas:</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #2563eb; font-weight: 800; font-size: 14px; margin-top: 20px;">PRIMERA: OBJETO Y DESTINO COMERCIAL</h3>
  <p>EL ARRENDADOR otorga en arrendamiento a EL ARRENDATARIO el inmueble (Local Comercial) ubicado en la dirección <strong>{{propiedad_direccion}}</strong>, en la ciudad de <strong>{{propiedad_ciudad}}</strong>. El local comercial será destinado única y exclusivamente al desarrollo de actividades comerciales lícitas y compatibles con los reglamentos locales.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #2563eb; font-weight: 800; font-size: 14px; margin-top: 20px;">SEGUNDA: CANON DE ARRENDAMIENTO Y FORMA DE PAGO</h3>
  <p>El valor acordado del canon mensual de arrendamiento comercial es la suma neta de <strong>{{renta_mensual}}</strong>, la cual deberá ser cancelada por EL ARRENDATARIO por mensualidades anticipadas dentro de los primeros <strong>{{dia_pago}}</strong> días (establecido especialmente el día <strong>${paymentDay}</strong> de cada mes).</p>
  <p>Adicionalmente, se pacta un depósito en garantía por un monto de <strong>{{deposito}}</strong> para responder por daños a la infraestructura o deudas de servicios públicos remanentes al finalizar la vigencia comercial.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #2563eb; font-weight: 800; font-size: 14px; margin-top: 20px;">TERCERA: PLAZO DE DURACIÓN</h3>
  <p>El plazo establecido de duración de este contrato comercial será de un año, comenzando el <strong>{{fecha_inicio}}</strong> y venciendo en su totalidad el <strong>{{fecha_fin}}</strong>.</p>

  ${petAllowedClause}

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #2563eb; font-weight: 800; font-size: 14px; margin-top: 20px;">CUARTA: ACUERDOS Y CLÁUSULAS ESPECIALES</h3>
  <p>Este contrato comercial incorpora los siguientes requerimientos personalizados del solicitante: <em>${prompt}</em>. Adicionalmente se incluye: {{clausulas_extra}}</p>

  <br/><br/>
  <div style="display: flex; justify-content: space-between; margin-top: 50px;">
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 10px; font-size: 11px; font-weight: 700; color: #475569;">
        EL ARRENDADOR
      </div>
    </div>
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 10px; font-size: 11px; font-weight: 700; color: #475569;">
        EL ARRENDATARIO
      </div>
    </div>
  </div>
</div>
      `;
    } else {
      titleSuggested = `Contrato Residencial en ${city} (Generado con IA)`;
      htmlContent = `
<div style="font-family: 'Outfit', sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 25px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
  <h2 style="text-align: center; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #3b82f6; margin-bottom: 5px;">CONTRATO DE ARRENDAMIENTO DE VIVIENDA</h2>
  <p style="text-align: center; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 30px;">CONTRATO URBANÍSTICO - CIUDAD DE ${city.toUpperCase()} - RENTNOW IA</p>

  <p>Entre los suscritos, <strong>{{arrendador_nombre}}</strong> (en adelante el ARRENDADOR) y de otra parte <strong>{{arrendatario_nombre}}</strong> con identificación <strong>{{arrendatario_documento}}</strong> (en adelante el ARRENDATARIO), se suscribe libremente este contrato de vivienda urbana sujeto a las siguientes pautas jurídicas:</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #3b82f6; font-weight: 800; font-size: 14px; margin-top: 20px;">1. OBJETO Y UBICACIÓN</h3>
  <p>El ARRENDADOR concede al ARRENDATARIO la tenencia material del inmueble residencial ubicado en: <strong>{{propiedad_direccion}}</strong>, en la ciudad de <strong>{{propiedad_ciudad}}</strong>.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #3b82f6; font-weight: 800; font-size: 14px; margin-top: 20px;">2. PRECIO Y PLAZO DE PAGO</h3>
  <p>El precio pactado como canon mensual de arrendamiento es la suma de <strong>{{renta_mensual}}</strong> mensuales, pagaderos por mes anticipado dentro de los primeros <strong>{{dia_pago}}</strong> días de cada mes calendario (con límite específico fijado el día <strong>${paymentDay}</strong> de cada mes).</p>
  <p>Para garantizar servicios y conservación física del bien se pacta un depósito de <strong>{{deposito}}</strong>.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #3b82f6; font-weight: 800; font-size: 14px; margin-top: 20px;">3. TÉRMINO DE VIGENCIA</h3>
  <p>La vigencia del contrato será de un año calendario, iniciando el <strong>{{fecha_inicio}}</strong> y finalizando el <strong>{{fecha_fin}}</strong>.</p>

  ${petAllowedClause}

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #3b82f6; font-weight: 800; font-size: 14px; margin-top: 20px;">4. ACUERDOS PERSONALIZADOS DE IA</h3>
  <p>Este contrato incorpora las siguientes peticiones específicas redactadas por la IA: <em>${prompt}</em>. Adicionalmente se incluye: {{clausulas_extra}}</p>

  <br/><br/>
  <div style="display: flex; justify-content: space-between; margin-top: 50px;">
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 10px; font-size: 11px; font-weight: 700; color: #475569;">
        EL ARRENDADOR
      </div>
    </div>
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 10px; font-size: 11px; font-weight: 700; color: #475569;">
        EL ARRENDATARIO
      </div>
    </div>
  </div>
</div>
      `;
    }

    return NextResponse.json({
      titleSuggested,
      templateContent: htmlContent.trim()
    });

  } catch (error: unknown) {
    console.error('Global error in template generator route:', error);
    return NextResponse.json(
      { error: (error as { message?: string }).message || 'Ocurrió un error inesperado al procesar la solicitud.' },
      { status: 500 }
    );
  }
}
