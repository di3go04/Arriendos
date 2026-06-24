import { NextResponse } from 'next/server'

// ⚠️ MOCK — Solo para demo/localhost.
// En producción reemplazar por consulta a Supabase:
//   const { data: contracts } = await supabase
//     .from('contracts')
//     .select('id, title, status, created_at, property:properties(title), tenant:profiles(full_name)')
//     .eq('landlord_id', userId)
//     .order('created_at', { ascending: false })

const MOCK_CONTRACTS = [
  {
    id: 'mock_001',
    title: 'Contrato Arrendamiento - Apartamento 301',
    property: { title: 'Edificio Torres del Parque - Apt 301' },
    tenant: { name: 'Carlos Mendoza' },
    monthlyRent: 2500000,
    status: 'ACTIVO',
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'mock_002',
    title: 'Contrato Arrendamiento - Local Comercial 5',
    property: { title: 'Centro Comercial Plaza Mayor - Local 5' },
    tenant: { name: 'María Gómez' },
    monthlyRent: 3800000,
    status: 'PENDIENTE_FIRMA',
    createdAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'mock_003',
    title: 'Contrato Arrendamiento - Casa 12',
    property: { title: 'Conjunto Residencial Los Pinos - Casa 12' },
    tenant: null,
    monthlyRent: 1800000,
    status: 'BORRADOR',
    createdAt: '2025-04-10T00:00:00.000Z',
  },
]

export async function GET() {
  return NextResponse.json({ data: MOCK_CONTRACTS })
}
