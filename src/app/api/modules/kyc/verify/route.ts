import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createKycService } from '@/modules/kyc/service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const formData = await req.formData();
  const documentFile = formData.get('document') as File | null;
  const selfieFile = formData.get('selfie') as File | null;
  const documentType = (formData.get('documentType') as string) || 'national_id';

  if (!documentFile || !selfieFile) {
    return NextResponse.json({ error: 'Documento y selfie requeridos' }, { status: 400 });
  }

  const toBase64 = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer();
    return Buffer.from(buf).toString('base64');
  };

  const [docBase64, selfieBase64] = await Promise.all([toBase64(documentFile), toBase64(selfieFile)]);

  const svc = createKycService();
  const result = await svc.uploadDocument(user.id, documentType, docBase64, selfieBase64);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const svc = createKycService();
  const status = await svc.getKycStatus(user.id);
  if (!status) return NextResponse.json({ ok: false, error: 'Sin verificación KYC' }, { status: 404 });
  return NextResponse.json({ ok: true, data: status });
}
