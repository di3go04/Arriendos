import { createSupabaseServerClient } from '@/lib/supabase-server';
import { hashContractContent, recordSignature } from '@/modules/e-signature/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { contractId, signerRole } = await req.json();
    if (!contractId || !['landlord', 'tenant'].includes(signerRole)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const { data: contract } = await supabase
      .from('contracts')
      .select('id, contract_content, landlord_id, tenant_id, signed_by_landlord, signed_by_tenant')
      .eq('id', contractId)
      .single();

    if (!contract) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });

    const isLandlord = contract.landlord_id === user.id;
    const isTenant = contract.tenant_id === user.id;
    if ((signerRole === 'landlord' && !isLandlord) || (signerRole === 'tenant' && !isTenant)) {
      return NextResponse.json({ error: 'No autorizado para firmar' }, { status: 403 });
    }

    const contentHash = hashContractContent(contract.contract_content || '');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || null;
    const userAgent = req.headers.get('user-agent');

    const result = await recordSignature({
      contractId,
      signerRole,
      ip,
      userAgent,
      contentHash,
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

    const bothSigned =
      signerRole === 'landlord'
        ? contract.signed_by_tenant
        : contract.signed_by_landlord;

    if (bothSigned) {
      await supabase.from('contracts').update({ status: 'firmado' }).eq('id', contractId);
    }

    await supabase.from('notifications').insert({
      user_id: signerRole === 'landlord' ? contract.tenant_id : contract.landlord_id,
      title: 'Contrato firmado',
      message: `Firma registrada (${signerRole}). Hash: ${contentHash.slice(0, 12)}…`,
      type: 'success',
    });

    return NextResponse.json({
      success: true,
      signedAt: result.signedAt,
      contentHash: result.hash,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
