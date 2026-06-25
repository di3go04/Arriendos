/**
 * demo-fallbacks.ts
 * ==================
 * Central de respuestas mock para las 5 APIs externas cuando DEMO_MODE=true.
 * Cada función replica EXACTAMENTE el shape de respuesta de la API real.
 */

import { isDemoMode, simulateDelay } from './demo'

// ──────────────────────────────────────────────
// 1. Belvo — Open Banking (Verificación Solvencia)
// ──────────────────────────────────────────────

export interface DemoBelvoLink {
  id: string
  widget_url: string
  institution: string
  created_at: string
}

export interface DemoBelvoAccount {
  id: string
  link: string
  name: string
  type: 'checking' | 'savings' | 'credit_card'
  balance: { current: number; available: number }
  currency: string
}

export interface DemoBelvoTransaction {
  id: string
  account: string
  description: string
  amount: number
  type: 'INFLOW' | 'OUTFLOW'
  transaction_date: string
  status: 'settled' | 'pending'
  merchant: { name: string } | null
}

export function getDemoBelvoLink(userId: string): DemoBelvoLink {
  return {
    id: `demo-link-${userId.slice(0, 8)}`,
    widget_url: `https://widget.belvo.com/demo/${userId}`,
    institution: 'erebor_ni',
    created_at: new Date().toISOString(),
  }
}

export function getDemoBelvoAccounts(linkId: string): DemoBelvoAccount[] {
  return [
    { id: `${linkId}-acc-1`, link: linkId, name: 'Cuenta de Nómina', type: 'checking', balance: { current: 12500, available: 12200 }, currency: 'MXN' },
    { id: `${linkId}-acc-2`, link: linkId, name: 'Tarjeta de Crédito', type: 'credit_card', balance: { current: -3400, available: 6600 }, currency: 'MXN' },
    { id: `${linkId}-acc-3`, link: linkId, name: 'Cuenta de Ahorros', type: 'savings', balance: { current: 45000, available: 45000 }, currency: 'MXN' },
  ]
}

export function getDemoBelvoTransactions(linkId: string): DemoBelvoTransaction[] {
  const tx: DemoBelvoTransaction[] = [
    { id: `${linkId}-tx-1`, account: `${linkId}-acc-1`, description: 'Nómina mensual — Empresa ABC', amount: 18000, type: 'INFLOW', transaction_date: '2026-06-01', status: 'settled', merchant: { name: 'Empresa ABC' } },
    { id: `${linkId}-tx-2`, account: `${linkId}-acc-1`, description: 'Transferencia recibida', amount: 5000, type: 'INFLOW', transaction_date: '2026-06-05', status: 'settled', merchant: null },
    { id: `${linkId}-tx-3`, account: `${linkId}-acc-1`, description: 'Pago de renta — Casa Palermo', amount: 1200, type: 'OUTFLOW', transaction_date: '2026-06-03', status: 'settled', merchant: { name: 'RentNow' } },
    { id: `${linkId}-tx-4`, account: `${linkId}-acc-1`, description: 'Supermercado — Chedraui', amount: 850, type: 'OUTFLOW', transaction_date: '2026-06-04', status: 'settled', merchant: { name: 'Chedraui' } },
    { id: `${linkId}-tx-5`, account: `${linkId}-acc-1`, description: 'Servicio de agua', amount: 320, type: 'OUTFLOW', transaction_date: '2026-06-06', status: 'settled', merchant: null },
    { id: `${linkId}-tx-6`, account: `${linkId}-acc-1`, description: 'Pago de electricidad', amount: 450, type: 'OUTFLOW', transaction_date: '2026-06-07', status: 'settled', merchant: null },
    { id: `${linkId}-tx-7`, account: `${linkId}-acc-1`, description: 'Internet + Cable', amount: 699, type: 'OUTFLOW', transaction_date: '2026-06-08', status: 'settled', merchant: null },
    { id: `${linkId}-tx-8`, account: `${linkId}-acc-2`, description: 'Cargo mensual tarjeta', amount: 3400, type: 'OUTFLOW', transaction_date: '2026-06-10', status: 'settled', merchant: null },
    { id: `${linkId}-tx-9`, account: `${linkId}-acc-1`, description: 'Freelance — Desarrollo Web', amount: 8500, type: 'INFLOW', transaction_date: '2026-06-12', status: 'pending', merchant: { name: 'Cliente Freelance' } },
    { id: `${linkId}-tx-10`, account: `${linkId}-acc-3`, description: 'Interés mensual ahorros', amount: 95, type: 'INFLOW', transaction_date: '2026-06-15', status: 'settled', merchant: null },
  ]
  return tx
}

export function getDemoSolvencyScore(userId: string): SolvencyScoreDemo {
  return {
    userId,
    status: 'approved',
    averageMonthlyIncome: 26500,
    averageMonthlyExpenses: 14200,
    debtToIncomeRatio: 0.54,
    maxRecommendedRent: 9275,
    confidence: 0.92,
    evaluatedAt: new Date().toISOString(),
    linkId: `demo-link-${userId.slice(0, 8)}`,
  }
}

interface SolvencyScoreDemo {
  userId: string
  status: 'approved' | 'rejected' | 'pending_review'
  averageMonthlyIncome: number
  averageMonthlyExpenses: number
  debtToIncomeRatio: number
  maxRecommendedRent: number
  confidence: number
  evaluatedAt: string
  linkId: string
}

// ──────────────────────────────────────────────
// 2. Belvo/Onfido — KYC Digital
// ──────────────────────────────────────────────

export function getDemoKycResult(): {
  ok: boolean
  status: 'verified' | 'rejected' | 'pending'
  confidence: number
  faceMatchScore: number
  documentNumber: string
  fullName: string
} {
  return {
    ok: true,
    status: 'verified',
    confidence: 0.97,
    faceMatchScore: 0.94,
    documentNumber: `DNI-${String(Math.random()).slice(2, 10)}`,
    fullName: 'Carlos Alberto López García',
  }
}

// ──────────────────────────────────────────────
// 3. Twilio/Vapi.ai — Agentes de Voz
// ──────────────────────────────────────────────

export function getDemoVoiceCallResult(tenantName: string, debtAmount: number): {
  ok: boolean
  callSid: string
  status: string
  duration: string
  transcript: string
  commitment: {
    amount: number
    promisedDate: string
    intent: string
  }
} {
  const promisedDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  return {
    ok: true,
    callSid: `demo-call-${Date.now()}`,
    status: 'completed',
    duration: '2m 34s',
    transcript: `Agente: Hola ${tenantName}, soy el asistente de RentNow. Tu pago de $${debtAmount} tiene 5 días de retraso.
${tenantName}: Sí, lo sé. Lo siento, ¿puedo pagar el viernes?
Agente: Claro. Agendo compromiso para el ${promisedDate}. Te enviaré un recordatorio.`,
    commitment: {
      amount: debtAmount,
      promisedDate,
      intent: 'payment_deferred',
    },
  }
}

// ──────────────────────────────────────────────
// 4. Gemini AI — IA Generativa (Contratos + Marketing)
// ──────────────────────────────────────────────

export function getDemoContractHTML(variables: Record<string, string>): string {
  return `<div style="font-family:serif; padding:2rem;">
<h1 style="text-align:center;">CONTRATO DE ARRENDAMIENTO</h1>
<p style="text-align:center;">(Generado por RentNow IA — Modo Demostración)</p>
<hr/>
<p><strong>ARRENDADOR:</strong> ${variables.landlordName || '[Nombre del Arrendador]'}</p>
<p><strong>ARRENDATARIO:</strong> ${variables.tenantName || '[Nombre del Inquilino]'}</p>
<p><strong>PROPIEDAD:</strong> ${variables.propertyAddress || '[Dirección de la Propiedad]'}</p>
<p><strong>RENTA MENSUAL:</strong> $${variables.monthlyRent || '[Monto]'} USD</p>
<p><strong>DURACIÓN:</strong> ${variables.leaseDuration || '12'} meses</p>
<p><strong>FECHA DE INICIO:</strong> ${variables.startDate || '[Fecha de Inicio]'}</p>
<hr/>
<h2>CLÁUSULAS</h2>
<p><strong>PRIMERA.</strong> El ARRENDADOR da en arrendamiento al ARRENDATARIO el inmueble descrito, quien lo recibe a su entera satisfacción.</p>
<p><strong>SEGUNDA.</strong> El ARRENDATARIO se obliga a pagar la renta mensual dentro de los primeros 5 días de cada mes.</p>
<p><strong>TERCERA.</strong> El depósito de garantía equivaldrá a 1 mes de renta y será devuelto al término del contrato.</p>
<p><strong>CUARTA.</strong> El ARRENDATARIO no podrá subarrendar ni ceder el contrato sin autorización escrita.</p>
<p><strong>QUINTA.</strong> Los gastos de mantenimiento menor correrán por cuenta del ARRENDATARIO.</p>
<hr/>
<h2>FIRMAS</h2>
<p>_________________________<br/>${variables.landlordName || 'Arrendador'}</p>
<p>_________________________<br/>${variables.tenantName || 'Arrendatario'}</p>
<p style="font-size:0.8rem;">Este documento fue generado digitalmente con fines de demostración.</p>
</div>`
}

export function getDemoMarketingContent(): MarketingContentDemo {
  const items = [
    {
      title: 'Penthouse Ejecutivo con Vista 360°',
      description: 'Impresionante penthouse de 180m² en el corazón financiero. Terraza privada con piscina infinita, domótica integrada y vista panorámica de la ciudad. 3 habitaciones, 2 baños, estacionamiento para 2 autos.',
      seoDescription: 'Penthouse ejecutivo en renta | Vista panorámica | Domótica | 180m² | Zona financiera',
      highlights: ['Vista 360° panorámica de la ciudad', 'Domótica de última generación con control por voz', 'Piscina infinita en terraza privada de 40m²'],
      socialCopy: '✨ ¿Te imaginas despertar con esta vista? Penthouse ejecutivo de 180m² con domótica, piscina infinita y la mejor ubicación de la ciudad. 🌆🏠 #Lujo #Penthouse #Vista360',
      metaTags: ['penthouse', 'ejecutivo', 'renta', 'vista panorámica', 'domótica', 'lujo'],
      suggestedAmenities: ['Piscina infinita', 'Domótica', 'Terraza privada', 'Estacionamiento doble', 'Gimnasio', 'Seguridad 24h'],
    },
    {
      title: 'Loft Industrial en Zona Bohemia',
      description: 'Loft de 90m² con estilo industrial, ladrillo visto, techos de 5m y balcón interior. Ubicado en el barrio más trendy con cafés, galerías y vida nocturna.',
      seoDescription: 'Loft industrial renta | Zona bohemia | Techos altos | 90m² | Estilo único',
      highlights: ['Techos de 5 metros con vigas de acero originales', 'Balcón interior con jardín vertical', 'Ubicación en el barrio más trendy de la ciudad'],
      socialCopy: '🖤 Loft industrial con alma. Ladrillo visto, techos de 5m y el balcón interior perfecto para tu café matutino. ☕🏗️ #Loft #Industrial #Bohemio',
      metaTags: ['loft', 'industrial', 'bohemio', 'renta', 'techos altos'],
      suggestedAmenities: ['Balcón interior', 'Jardín vertical', 'Cocina integral', 'Lavandería', 'Bodega'],
    },
    {
      title: 'Casa Familiar con Jardín y Alberca',
      description: 'Amplia casa de 250m² en zona residencial, 4 habitaciones, 3 baños, jardín con alberca, asador y área de juegos. Perfecta para familias.',
      seoDescription: 'Casa familiar renta | Jardín | Alberca | 4 habitaciones | Zona residencial',
      highlights: ['Jardín de 120m² con alberca y asador', 'Área de juegos infantiles', 'Cuarto de servicio con entrada independiente'],
      socialCopy: '🌳 El hogar que tu familia merece. Casa de 250m² con jardín, alberca y área de juegos. Todo en una zona residencial tranquila. 🏡💚 #CasaFamiliar #Jardín #Alberca',
      metaTags: ['casa', 'familiar', 'jardín', 'alberca', 'residencial'],
      suggestedAmenities: ['Alberca', 'Asador', 'Jardín', 'Área de juegos', 'Cuarto de servicio', 'Estacionamiento 3 autos'],
    },
    {
      title: 'Estudio Amueblado para Joven Profesional',
      description: 'Estudio de 40m² completamente amueblado en el centro. Ideal para profesionistas solteros. Gimnasio, lavandería y seguridad 24h.',
      seoDescription: 'Estudio amueblado renta | Centro | Profesional | 40m² | Gimnasio',
      highlights: ['Completamente amueblado con diseño contemporáneo', 'Gimnasio y lavandería en el edificio', 'A pasos del transporte público y restaurantes'],
      socialCopy: '🎯 Tu primer hogar profesional. Estudio amueblado de 40m² en el centro, con gimnasio y seguridad 24h. Todo lo que necesitas, nada que te sobre. 🏙️✨ #Estudio #Amueblado #Centro',
      metaTags: ['estudio', 'amueblado', 'centro', 'profesional', 'gimnasio'],
      suggestedAmenities: ['Amueblado', 'Gimnasio', 'Lavandería', 'Seguridad 24h', 'Roof garden'],
    },
    {
      title: 'Local Comercial en Zona Turística',
      description: 'Local de 60m² en la calle principal, perfecto para retail o restaurante. Alta afluencia peatonal, vitrina amplia, baño privado y bodega.',
      seoDescription: 'Local comercial renta | Zona turística | Retail | 60m² | Alta afluencia',
      highlights: ['Alta afluencia peatonal: 5000+ personas/día', 'Vitrina de 8 metros sobre calle principal', 'Permisos para restaurante con terraza'],
      socialCopy: '🏪 El lugar perfecto para tu negocio. Local de 60m² en la calle principal de la zona turística. 5000+ personas al día pasan frente a tu vitrina. 📈💰 #LocalComercial #Retail #ZonaTurística',
      metaTags: ['local', 'comercial', 'turístico', 'retail', 'restaurante'],
      suggestedAmenities: ['Baño privado', 'Bodega', 'Terraza', 'Vitrina', 'Aire acondicionado'],
    },
  ]
  return items[Math.floor(Math.random() * items.length)]
}

interface MarketingContentDemo {
  title: string
  description: string
  seoDescription: string
  highlights: string[]
  socialCopy: string
  metaTags: string[]
  suggestedAmenities: string[]
}

// ──────────────────────────────────────────────
// 5. Belvo — Conciliación Bancaria
// ──────────────────────────────────────────────

export function getDemoBankSyncResult(): { ok: boolean; synced: number; matches: number } {
  return {
    ok: true,
    synced: 12,
    matches: 5,
  }
}

export function getDemoReconciliationMatches(): ReconciliationMatchDemo[] {
  return [
    { id: 'demo-match-1', bankTxId: 'demo-tx-1', paymentId: 'demo-pay-1', amount: 1200, confidence: 0.97, status: 'confirmed', description: 'Pago arriendo Casa Palermo', date: '2026-06-03' },
    { id: 'demo-match-2', bankTxId: 'demo-tx-2', paymentId: 'demo-pay-2', amount: 2400, confidence: 0.95, status: 'confirmed', description: 'Transferencia Penthouse Bogotá', date: '2026-06-14' },
    { id: 'demo-match-3', bankTxId: 'demo-tx-3', paymentId: 'demo-pay-3', amount: 800, confidence: 0.88, status: 'confirmed', description: 'Pago estudio CDMX', date: '2026-06-10' },
    { id: 'demo-match-4', bankTxId: 'demo-tx-4', paymentId: 'demo-pay-4', amount: 2000, confidence: 0.72, status: 'pending', description: 'Depósito garantía PH Palermo', date: '2026-06-01' },
    { id: 'demo-match-5', bankTxId: 'demo-tx-5', paymentId: 'demo-pay-5', amount: 3500, confidence: 0.65, status: 'pending', description: 'Renta Casa Playa Cartagena', date: '2026-05-28' },
  ]
}

interface ReconciliationMatchDemo {
  id: string
  bankTxId: string
  paymentId: string
  amount: number
  confidence: number
  status: 'confirmed' | 'pending'
  description: string
  date: string
}

// ──────────────────────────────────────────────
// 6. Stripe — Pagos (Demo)
// ──────────────────────────────────────────────

export function getDemoCheckoutSession(planId: string, price: number): { url: string; sessionId: string } {
  return {
    url: `/demo/payment/success?plan=${planId}&price=${price}`,
    sessionId: `demo-cs-${Date.now()}`,
  }
}

// ──────────────────────────────────────────────
// Utilitario: Ejecutar función con fallback demo
// ──────────────────────────────────────────────

type DemoFallbackFn<T> = () => T | Promise<T>

export async function withDemoFallback<T>(
  realFn: () => Promise<T>,
  demoFn: DemoFallbackFn<T>,
): Promise<T> {
  if (isDemoMode()) {
    await simulateDelay(600 + Math.random() * 900)
    return demoFn()
  }
  return realFn()
}
