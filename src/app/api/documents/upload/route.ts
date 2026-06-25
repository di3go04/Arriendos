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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('type') as string || 'document';

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase
      .storage
      .from('documents')
      .getPublicUrl(fileName);

    await supabase.from('documents').insert({
      contract_id: null,
      uploaded_by: user.id,
      name: file.name,
      file_url: publicUrl,
      type: docType === 'contract' ? 'anexo' : 'otro',
    });

    const extractedData: Record<string, string> = {
      'Nombre del archivo': file.name,
      'Tipo': docType === 'contract' ? 'Contrato' : 'Documento',
      'Tamaño': `${(file.size / 1024).toFixed(1)} KB`,
      'Fecha de procesamiento': new Date().toLocaleDateString(),
    };

    if (file.type.includes('pdf') || file.type.includes('image')) {
      extractedData['Estado OCR'] = 'Simulado';
      extractedData['Páginas procesadas'] = '1';
    }

    return NextResponse.json({
      ok: true,
      fileUrl: publicUrl,
      fileName: file.name,
      extractedData,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error al procesar documento',
    }, { status: 500 });
  }
}
