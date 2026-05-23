import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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

    const { tenantId } = await req.json();

    // Obtener historial de pagos del inquilino
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false })
      .limit(24);

    const { data: contracts } = await supabase
      .from('contracts')
      .select('monthly_rent, start_date, end_date, status')
      .eq('tenant_id', tenantId);

    const { data: tenant } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', tenantId)
      .single();

    if (!payments?.length) {
      return NextResponse.json({
        score: 50,
        risk: 'medium',
        message: 'Historial insuficiente para predicción precisa.',
        details: { paymentHistory: 0, onTimeRate: 0, avgDelay: 0 },
      });
    }

    // Calcular métricas
    const totalPayments = payments.length;
    const paidOnTime = payments.filter(p => p.paid && new Date(p.paid_at!) <= new Date(p.due_date)).length;
    const latePayments = payments.filter(p => p.paid && new Date(p.paid_at!) > new Date(p.due_date)).length;
    const unpaidPayments = payments.filter(p => !p.paid).length;

    const onTimeRate = totalPayments > 0 ? (paidOnTime / totalPayments) * 100 : 0;
    const lateRate = totalPayments > 0 ? (latePayments / totalPayments) * 100 : 0;
    const defaultRate = totalPayments > 0 ? (unpaidPayments / totalPayments) * 100 : 0;

    // Calcular días promedio de retraso
    const delays = payments
      .filter(p => p.paid && p.paid_at)
      .map(p => Math.max(0, Math.floor((new Date(p.paid_at!).getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24))));
    const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

    // Puntaje de riesgo (0-100, más alto = más riesgo)
    const score = Math.min(100, Math.round(
      (100 - onTimeRate) * 0.5 +
      defaultRate * 0.3 +
      Math.min(avgDelay, 90) * 0.2
    ));

    let risk: string;
    let recommendation: string;

    if (score < 25) {
      risk = 'low';
      recommendation = 'Inquilino confiable. Historial de pagos excelente.';
    } else if (score < 50) {
      risk = 'medium';
      recommendation = 'Riesgo moderado. Monitorear pagos mensualmente.';
    } else if (score < 75) {
      risk = 'high';
      recommendation = 'Riesgo elevado. Considerar recordatorios frecuentes y cláusulas de garantía.';
    } else {
      risk = 'critical';
      recommendation = 'Riesgo crítico. Evaluar acciones legales o plan de pago.';
    }

    // Usar IA para análisis detallado si está disponible
    let aiAnalysis = null;
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
          Eres un analista financiero experto en gestión de arrendamientos.
          Analiza el siguiente perfil de pago de un inquilino y da una recomendación:
          
          Inquilino: ${(tenant as LooseRecord)?.full_name || 'Desconocido'}
          Total pagos: ${totalPayments}
          Tasa de pago a tiempo: ${onTimeRate.toFixed(1)}%
          Tasa de morosidad: ${defaultRate.toFixed(1)}%
          Retraso promedio: ${avgDelay.toFixed(0)} días
          Renta mensual: ${contracts?.[0]?.monthly_rent || 'N/A'}
          
          Proporciona:
          1. Nivel de riesgo (bajo/medio/alto/crítico)
          2. Probabilidad de morosidad próximos 3 meses (%)
          3. Recomendación específica para el arrendador
          4. Estrategia de cobro sugerida
        `;
        const result = await model.generateContent(prompt);
        aiAnalysis = result.response.text();
      } catch {
        // Fallback al análisis local
      }
    }

    return NextResponse.json({
      score,
      risk,
      message: recommendation,
      aiAnalysis,
      details: {
        totalPayments,
        paidOnTime,
        latePayments,
        unpaidPayments,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        lateRate: Math.round(lateRate * 10) / 10,
        defaultRate: Math.round(defaultRate * 10) / 10,
        avgDelay: Math.round(avgDelay * 10) / 10,
      },
    });
  } catch (error: unknown) {
    console.error('Error en predicción de morosidad:', error);
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}