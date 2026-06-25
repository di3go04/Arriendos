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

    const { contractId, signerRole } = await req.json();
    if (!contractId || !signerRole) {
      return NextResponse.json({ error: 'contractId y signerRole requeridos' }, { status: 400 });
    }

    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!contract) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });

    const headers = req.headers;
    const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    const updates: LooseRecord = {
      signed_at: new Date().toISOString(),
      signed_ip: ip,
      signed_user_agent: userAgent,
    };

    if (signerRole === 'landlord') {
      updates.signed_by_landlord = true;
      updates.landlord_signed_at = new Date().toISOString();
    } else if (signerRole === 'tenant') {
      updates.signed_by_tenant = true;
      updates.tenant_signed_at = new Date().toISOString();
    }

    if (contract.signed_by_landlord && contract.signed_by_tenant) {
      updates.status = 'firmado';
    } else {
      updates.status = 'pendiente_firma';
    }

    const { error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', contractId);

    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: signerRole === 'landlord' ? contract.tenant_id : contract.landlord_id,
      title: 'Contrato firmado',
      message: `El contrato ha sido firmado por ${signerRole === 'landlord' ? 'el arrendador' : 'el inquilino'}.`,
      type: 'success',
      contract_id: contractId,
    });

    return NextResponse.json({ success: true, signedAt: updates.signed_at, ip });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 });
  }
}
