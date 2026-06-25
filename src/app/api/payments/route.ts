import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ data: [] });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from('payments')
      .select('*, contracts(contract_number, monthly_rent, properties(title))')
      .order('due_date', { ascending: false })
      .limit(20);

    if (error) {
      // Fallback without join
      const { data: simple } = await supabase.from('payments').select('*').order('due_date', { ascending: false }).limit(20);
      return NextResponse.json({ data: simple || [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
