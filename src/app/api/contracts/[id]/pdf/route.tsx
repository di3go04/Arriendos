import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer'

const COLORS = {
  primary: '#1e3a5f',
  accent: '#f59e0b',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  background: '#f8fafc',
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 130,
    fontSize: 10,
    color: COLORS.muted,
  },
  value: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusSigned: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusDraft: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusExpired: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  contractText: {
    fontSize: 8,
    lineHeight: 1.6,
    color: COLORS.text,
    fontFamily: 'Courier',
  },
  signatureSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    height: 1,
    backgroundColor: COLORS.text,
    marginTop: 32,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    fontSize: 7,
    color: COLORS.muted,
  },
  amountLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  amountPeriod: {
    fontSize: 9,
    color: COLORS.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridHalf: {
    width: '50%',
    marginBottom: 8,
  },
})

interface ContractData {
  id: string
  property: string
  tenant: string
  status: string
  amount: string
  startDate: string
  endDate: string
  deposit: string
  contractText: string
  signedByLandlord: boolean
  signedByTenant: boolean
}

const MOCK_CONTRACTS: Record<string, ContractData> = {
  '1': {
    id: '1',
    property: 'Edificio Mediterráneo',
    tenant: 'Carlos López',
    status: 'firmado',
    amount: '$1,500,000',
    startDate: '2026-01-15',
    endDate: '2027-01-15',
    deposit: '$1,500,000',
    contractText: `CONTRATO DE ARRENDAMIENTO

Entre el arrendador y Carlos López, identificado con cédula de ciudadanía, quien en adelante se denominará EL ARRENDATARIO, se celebra el presente contrato de arrendamiento del inmueble ubicado en Edificio Mediterráneo, que en adelante se denominará EL INMUEBLE.

CLÁUSULA PRIMERA — OBJETO: El arrendador da en arrendamiento a EL ARRENDATARIO el inmueble denominado Edificio Mediterráneo, para ser destinado exclusivamente como vivienda.

CLÁUSULA SEGUNDA — PLAZO: El término de duración del presente contrato será de 2026-01-15 a 2027-01-15, pudiendo ser prorrogado por acuerdo mutuo.

CLÁUSULA TERCERA — CANON DE ARRENDAMIENTO: El canon mensual es de $1,500,000, que EL ARRENDATARIO pagará dentro de los primeros 5 días de cada mes.

CLÁUSULA CUARTA — DEPÓSITO: EL ARRENDATARIO entrega en este acto la suma de $1,500,000 como depósito de garantía, que será devuelto al finalizar el contrato si el inmueble se entrega en buen estado.

CLÁUSULA QUINTA — MORA: En caso de mora en el pago del canon, EL ARRENDATARIO pagará un interés moratorio del 1.5% mensual sobre el valor adeudado.

CLÁUSULA SEXTA — SERVICIOS PÚBLICOS: Los servicios públicos serán pagados por EL ARRENDATARIO durante la vigencia del contrato.

CLÁUSULA SÉPTIMA — MANTENIMIENTO: EL ARRENDATARIO se obliga a mantener EL INMUEBLE en buen estado de conservación y realizará las reparaciones menores necesarias.

CLÁUSULA OCTAVA — TERMINACIÓN ANTICIPADA: Cualquiera de las partes podrá dar por terminado el contrato con un preaviso de 30 días calendario.

Para constancia se firma en la ciudad a los 15 días del mes de enero de 2026.`,
    signedByLandlord: true,
    signedByTenant: true,
  },
  '2': {
    id: '2',
    property: 'Casa Laureles',
    tenant: 'María García',
    status: 'pendiente_firma',
    amount: '$3,200,000',
    startDate: '2026-02-01',
    endDate: '2027-02-01',
    deposit: '$3,200,000',
    contractText: `CONTRATO DE ARRENDAMIENTO

Entre el arrendador y María García, identificado con cédula de ciudadanía, quien en adelante se denominará EL ARRENDATARIO, se celebra el presente contrato de arrendamiento del inmueble ubicado en Casa Laureles, que en adelante se denominará EL INMUEBLE.

CLÁUSULA PRIMERA — OBJETO: El arrendador da en arrendamiento a EL ARRENDATARIO el inmueble denominado Casa Laureles, para ser destinado exclusivamente como vivienda.

CLÁUSULA SEGUNDA — PLAZO: El término de duración del presente contrato será de 2026-02-01 a 2027-02-01, pudiendo ser prorrogado por acuerdo mutuo.

CLÁUSULA TERCERA — CANON DE ARRENDAMIENTO: El canon mensual es de $3,200,000, que EL ARRENDATARIO pagará dentro de los primeros 5 días de cada mes.

CLÁUSULA CUARTA — DEPÓSITO: EL ARRENDATARIO entrega en este acto la suma de $3,200,000 como depósito de garantía, que será devuelto al finalizar el contrato si el inmueble se entrega en buen estado.

CLÁUSULA QUINTA — MORA: En caso de mora en el pago del canon, EL ARRENDATARIO pagará un interés moratorio del 1.5% mensual sobre el valor adeudado.

Para constancia se firma en la ciudad a los 1 días del mes de febrero de 2026.`,
    signedByLandlord: true,
    signedByTenant: false,
  },
  '3': {
    id: '3',
    property: 'Coliving El Poblado',
    tenant: 'Andrés Medina',
    status: 'vencido',
    amount: '$1,200,000',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    deposit: '$1,200,000',
    contractText: `CONTRATO DE ARRENDAMIENTO

Entre el arrendador y Andrés Medina, se celebra el presente contrato de arrendamiento del inmueble ubicado en Coliving El Poblado.

CLÁUSULA PRIMERA — OBJETO: El arrendador da en arrendamiento a EL ARRENDATARIO el inmueble denominado Coliving El Poblado.

CLÁUSULA SEGUNDA — PLAZO: El término de duración del presente contrato será de 2025-01-01 a 2026-01-01.

CLÁUSULA TERCERA — CANON DE ARRENDAMIENTO: El canon mensual es de $1,200,000.

Para constancia se firma en la ciudad a los 1 días del mes de enero de 2025.`,
    signedByLandlord: true,
    signedByTenant: true,
  },
}

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  pendiente_firma: 'Pendiente de Firma',
  firmado: 'Firmado',
  vencido: 'Vencido',
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'firmado': return styles.statusSigned
    case 'borrador': return styles.statusDraft
    case 'pendiente_firma': return styles.statusPending
    case 'vencido': return styles.statusExpired
    default: return styles.statusDraft
  }
}

function ContractPDFDocument({ contract }: { contract: ContractData }) {
  const renderStatus = () => {
    if (contract.signedByLandlord && contract.signedByTenant) return 'Firmado por ambas partes'
    if (contract.signedByLandlord) return 'Firmado por arrendador'
    if (contract.signedByTenant) return 'Firmado por arrendatario'
    return 'Pendiente de firma'
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Rent<Text style={styles.logoAccent}>Now</Text>
          </Text>
          <View>
            <Text style={styles.title}>Contrato de Arrendamiento</Text>
            <Text style={styles.subtitle}>Documento legalmente vinculante</Text>
          </View>
          <Text style={{ fontSize: 8, color: COLORS.muted }}>#{contract.id.padStart(4, '0')}</Text>
        </View>

        {/* Contract Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Contrato</Text>
          <View style={styles.grid}>
            <View style={styles.gridHalf}>
              <View style={styles.row}>
                <Text style={styles.label}>Propiedad:</Text>
                <Text style={styles.value}>{contract.property}</Text>
              </View>
            </View>
            <View style={styles.gridHalf}>
              <View style={styles.row}>
                <Text style={styles.label}>Inquilino:</Text>
                <Text style={styles.value}>{contract.tenant}</Text>
              </View>
            </View>
            <View style={styles.gridHalf}>
              <View style={styles.row}>
                <Text style={styles.label}>Estado:</Text>
                <Text style={[styles.value, { color: contract.status === 'firmado' ? '#065f46' : contract.status === 'vencido' ? '#991b1b' : COLORS.primary }]}>
                  {STATUS_LABELS[contract.status] || contract.status}
                </Text>
              </View>
            </View>
            <View style={styles.gridHalf}>
              <View style={styles.row}>
                <Text style={styles.label}>Firma:</Text>
                <Text style={styles.value}>{renderStatus()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles Financieros</Text>
          <View style={styles.grid}>
            <View style={styles.gridHalf}>
              <Text style={styles.amountLarge}>{contract.amount}</Text>
              <Text style={styles.amountPeriod}>Canon mensual</Text>
            </View>
            <View style={styles.gridHalf}>
              <Text style={[styles.amountLarge, { color: COLORS.muted }]}>{contract.deposit}</Text>
              <Text style={styles.amountPeriod}>Depósito de garantía</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={styles.label}>Fecha de inicio:</Text>
            <Text style={styles.value}>{contract.startDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de fin:</Text>
            <Text style={styles.value}>{contract.endDate}</Text>
          </View>
        </View>

        {/* Contract Text */}
        {contract.contractText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Términos y Condiciones</Text>
            <Text style={styles.contractText}>{contract.contractText}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <Text style={[styles.sectionTitle, { borderBottomColor: COLORS.accent }]}>Firmas</Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Arrendador</Text>
              <Text style={[styles.signatureLabel, { fontSize: 8, marginTop: 2 }]}>
                {contract.signedByLandlord ? 'Firmado' : 'Pendiente'}
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Arrendatario</Text>
              <Text style={[styles.signatureLabel, { fontSize: 8, marginTop: 2 }]}>
                {contract.signedByTenant ? 'Firmado' : 'Pendiente'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>RentNow — Plataforma de Gestión de Arrendamientos</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    let contract: ContractData | null = null

    // Try Supabase first
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() {},
          },
        },
      )
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single()
      if (!error && data) {
        contract = {
          id: data.id,
          property: data.property || data.property_title || '—',
          tenant: data.tenant || data.tenant_name || '—',
          status: data.status || 'borrador',
          amount: data.amount || data.monthly_rent ? `$${Number(data.monthly_rent).toLocaleString('es-CO')}` : '—',
          startDate: data.start_date || data.startDate || '—',
          endDate: data.end_date || data.endDate || '—',
          deposit: data.deposit ? `$${Number(data.deposit).toLocaleString('es-CO')}` : '—',
          contractText: data.contract_text || data.contractText || '',
          signedByLandlord: data.signed_by_landlord || data.signedByLandlord || false,
          signedByTenant: data.signed_by_tenant || data.signedByTenant || false,
        }
      }
    } catch {
      // Fall through to mock
    }

    // Fallback to mock data
    if (!contract) {
      contract = MOCK_CONTRACTS[id] || null
    }

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    const stream = await renderToStream(<ContractPDFDocument contract={contract} />)
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    const filename = `contrato-${contract.property.toLowerCase().replace(/\s+/g, '-')}-${contract.id}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
