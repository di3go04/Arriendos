'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import confetti from 'canvas-confetti'
import {
  FileText, Plus, Sparkles, Search, Filter, X, Check, Loader2,
  Download, Trash2, Eye, PenSquare, ChevronLeft, ChevronRight,
  Building, User, CalendarDays, Clock, AlertTriangle, CheckCircle,
  MessageSquare, Send, Home, CreditCard, ArrowRight, FileSignature
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ContractStatus = 'borrador' | 'pendiente_firma' | 'firmado' | 'vencido'

interface Contract {
  id: string
  property: string
  tenant: string
  status: ContractStatus
  amount: string
  startDate: string
  endDate: string
  deposit: string
  contractText: string
  signedByLandlord: boolean
  signedByTenant: boolean
}

const statusLabel = (s: ContractStatus, t: (key: string) => string): string => {
  const labels: Record<ContractStatus, string> = {
    borrador: t('status_draft'),
    pendiente_firma: t('status_pending'),
    firmado: t('status_signed'),
    vencido: t('status_expired'),
  }
  return labels[s]
}

const STATUS_STYLES: Record<ContractStatus, string> = {
  borrador: 'bg-muted text-muted-foreground border-border',
  pendiente_firma: 'bg-amber-50 text-amber-700 border-amber-200',
  firmado: 'bg-success/10 text-success border-success/20',
  vencido: 'bg-destructive/10 text-destructive border-destructive/20',
}

const STATUS_ICONS: Record<ContractStatus, typeof FileText> = {
  borrador: FileText,
  pendiente_firma: Clock,
  firmado: CheckCircle,
  vencido: AlertTriangle,
}

const MOCK_PROPERTIES = [
  { id: 'p1', title: 'Edificio Mediterráneo' },
  { id: 'p2', title: 'Casa Laureles' },
  { id: 'p3', title: 'Coliving El Poblado' },
  { id: 'p4', title: 'Apartamento Santa Fe' },
]

const MOCK_TENANTS = [
  { id: 't1', name: 'Carlos López', email: 'carlos@email.com' },
  { id: 't2', name: 'María García', email: 'maria@email.com' },
  { id: 't3', name: 'Andrés Medina', email: 'andres@email.com' },
  { id: 't4', name: 'Laura Torres', email: 'laura@email.com' },
]

function generateContractText(data: {
  property: string; tenant: string; rent: string; deposit: string;
  startDate: string; endDate: string; paymentDay: string;
}) {
  return `CONTRATO DE ARRENDAMIENTO

Entre el arrendador y ${data.tenant}, identificado con cédula de ciudadanía, quien en adelante se denominará EL ARRENDATARIO, se celebra el presente contrato de arrendamiento del inmueble ubicado en ${data.property}, que en adelante se denominará EL INMUEBLE.

CLÁUSULA PRIMERA — OBJETO: El arrendador da en arrendamiento a EL ARRENDATARIO el inmueble denominado ${data.property}, para ser destinado exclusivamente como vivienda.

CLÁUSULA SEGUNDA — PLAZO: El término de duración del presente contrato será de ${data.startDate} a ${data.endDate}, pudiendo ser prorrogado por acuerdo mutuo.

CLÁUSULA TERCERA — CANON DE ARRENDAMIENTO: El canon mensual es de ${data.rent}, que EL ARRENDATARIO pagará dentro de los primeros ${data.paymentDay} días de cada mes.

CLÁUSULA CUARTA — DEPÓSITO: EL ARRENDATARIO entrega en este acto la suma de ${data.deposit} como depósito de garantía, que será devuelto al finalizar el contrato si el inmueble se entrega en buen estado.

CLÁUSULA QUINTA — MORA: En caso de mora en el pago del canon, EL ARRENDATARIO pagará un interés moratorio del 1.5% mensual sobre el valor adeudado.

CLÁUSULA SEXTA — SERVICIOS PÚBLICOS: Los servicios públicos serán pagados por EL ARRENDATARIO durante la vigencia del contrato.

CLÁUSULA SÉPTIMA — MANTENIMIENTO: EL ARRENDATARIO se obliga a mantener EL INMUEBLE en buen estado de conservación y realizará las reparaciones menores necesarias.

CLÁUSULA OCTAVA — TERMINACIÓN ANTICIPADA: Cualquiera de las partes podrá dar por terminado el contrato con un preaviso de 30 días calendario.

Para constancia se firma en la ciudad a los ${new Date().getDate()} días del mes de ${new Date().toLocaleString('es-ES', { month: 'long' })} de ${new Date().getFullYear()}.

_________________________          _________________________
ARRENDADOR                          ARRENDATARIO`
}

const AI_RESPONSES: Record<string, string> = {
  penalidad: 'La cláusula quinta establece una penalidad por mora del 1.5% mensual sobre el valor adeudado. Es decir, si el canon mensual es de $1,500,000, la penalidad mensual sería de $22,500.',
  canon: 'El canon de arrendamiento mensual se especifica en la cláusula tercera del contrato. El valor acordado debe pagarse dentro de los primeros días de cada mes.',
  deposito: 'El depósito de garantía se detalla en la cláusula cuarta. Este valor será devuelto al finalizar el contrato si el inmueble se entrega en buen estado.',
  termino: 'El plazo del contrato se define en la cláusula segunda, con posibilidad de prórroga por acuerdo mutuo entre las partes.',
  mora: 'La cláusula quinta regula la mora: interés del 1.5% mensual sobre cánones impagos.',
  general: 'Este contrato de arrendamiento regula la relación entre arrendador y arrendatario, incluyendo objeto, plazo, canon mensual, depósito de garantía, mora, servicios públicos y mantenimiento del inmueble.',
}

function findAnswer(question: string, contractText: string): string {
  const q = question.toLowerCase()
  if (q.includes('penalidad') || q.includes('mora') || q.includes('interés')) return AI_RESPONSES.penalidad
  if (q.includes('canon') || q.includes('renta') || q.includes('pago') || q.includes('mensual')) return AI_RESPONSES.canon
  if (q.includes('depósito') || q.includes('garantía')) return AI_RESPONSES.deposito
  if (q.includes('plazo') || q.includes('duración') || q.includes('terminación') || q.includes('vigencia')) return AI_RESPONSES.termino
  if (q.includes('mora')) return AI_RESPONSES.mora
  return AI_RESPONSES.general + ' ¿Puedes ser más específico?'
}

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: '1', property: 'Edificio Mediterráneo', tenant: 'Carlos López',
    status: 'firmado', amount: '$1,500,000', startDate: '2026-01-15', endDate: '2027-01-15',
    deposit: '$1,500,000', contractText: generateContractText({ property: 'Edificio Mediterráneo', tenant: 'Carlos López', rent: '$1,500,000', deposit: '$1,500,000', startDate: '2026-01-15', endDate: '2027-01-15', paymentDay: '5' }),
    signedByLandlord: true, signedByTenant: true,
  },
  {
    id: '2', property: 'Casa Laureles', tenant: 'María García',
    status: 'pendiente_firma', amount: '$3,200,000', startDate: '2026-02-01', endDate: '2027-02-01',
    deposit: '$3,200,000', contractText: generateContractText({ property: 'Casa Laureles', tenant: 'María García', rent: '$3,200,000', deposit: '$3,200,000', startDate: '2026-02-01', endDate: '2027-02-01', paymentDay: '5' }),
    signedByLandlord: true, signedByTenant: false,
  },
  {
    id: '3', property: 'Coliving El Poblado', tenant: 'Andrés Medina',
    status: 'vencido', amount: '$1,200,000', startDate: '2025-01-01', endDate: '2026-01-01',
    deposit: '$1,200,000', contractText: generateContractText({ property: 'Coliving El Poblado', tenant: 'Andrés Medina', rent: '$1,200,000', deposit: '$1,200,000', startDate: '2025-01-01', endDate: '2026-01-01', paymentDay: '5' }),
    signedByLandlord: true, signedByTenant: true,
  },
  {
    id: '4', property: 'Apartamento Santa Fe', tenant: 'Laura Torres',
    status: 'borrador', amount: '$2,100,000', startDate: '2026-07-01', endDate: '2027-07-01',
    deposit: '$2,100,000', contractText: generateContractText({ property: 'Apartamento Santa Fe', tenant: 'Laura Torres', rent: '$2,100,000', deposit: '$2,100,000', startDate: '2026-07-01', endDate: '2027-07-01', paymentDay: '5' }),
    signedByLandlord: false, signedByTenant: false,
  },
  {
    id: '5', property: 'Edificio Mediterráneo', tenant: 'Pedro Ramírez',
    status: 'firmado', amount: '$1,800,000', startDate: '2026-03-01', endDate: '2027-03-01',
    deposit: '$1,800,000', contractText: generateContractText({ property: 'Edificio Mediterráneo', tenant: 'Pedro Ramírez', rent: '$1,800,000', deposit: '$1,800,000', startDate: '2026-03-01', endDate: '2027-03-01', paymentDay: '10' }),
    signedByLandlord: true, signedByTenant: true,
  },
]

export default function ContractsPage() {
  const t = useTranslations('contracts_ai')
  const { user } = useAuth()

  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'todos'>('todos')

  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [selProperty, setSelProperty] = useState('')
  const [selTenant, setSelTenant] = useState('')
  const [wizRent, setWizRent] = useState('')
  const [wizDeposit, setWizDeposit] = useState('')
  const [wizStart, setWizStart] = useState('')
  const [wizEnd, setWizEnd] = useState('')
  const [wizPayDay, setWizPayDay] = useState('5')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')

  const [viewingContract, setViewingContract] = useState<Contract | null>(null)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isAiThinking, setIsAiThinking] = useState(false)

  const [showSignature, setShowSignature] = useState(false)
  const [signContract, setSignContract] = useState<Contract | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const filtered = contracts.filter(c => {
    if (statusFilter !== 'todos' && c.status !== statusFilter) return false
    if (search && !c.property.toLowerCase().includes(search.toLowerCase()) && !c.tenant.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  /* Wizard */
  const resetWizard = () => {
    setWizardStep(0); setSelProperty(''); setSelTenant('')
    setWizRent(''); setWizDeposit(''); setWizStart(''); setWizEnd(''); setWizPayDay('5')
    setGeneratedText(''); setShowWizard(false)
  }

  const handleGenerateAI = async () => {
    setIsGenerating(true)
    const prop = MOCK_PROPERTIES.find(p => p.id === selProperty)
    const ten = MOCK_TENANTS.find(t => t.id === selTenant)
    await new Promise(r => setTimeout(r, 2000))
    const text = generateContractText({
      property: prop?.title || '',
      tenant: ten?.name || '',
      rent: `$${Number(wizRent).toLocaleString('es-CO')}`,
      deposit: `$${Number(wizDeposit).toLocaleString('es-CO')}`,
      startDate: wizStart,
      endDate: wizEnd,
      paymentDay: wizPayDay,
    })
    setGeneratedText(text)
    setIsGenerating(false)
    setWizardStep(3)
  }

  const handleSaveGenerated = () => {
    const prop = MOCK_PROPERTIES.find(p => p.id === selProperty)
    const ten = MOCK_TENANTS.find(t => t.id === selTenant)
    const newContract: Contract = {
      id: Date.now().toString(),
      property: prop?.title || '',
      tenant: ten?.name || '',
      status: 'borrador',
      amount: `$${Number(wizRent).toLocaleString('es-CO')}`,
      startDate: wizStart,
      endDate: wizEnd,
      deposit: `$${Number(wizDeposit).toLocaleString('es-CO')}`,
      contractText: generatedText,
      signedByLandlord: false,
      signedByTenant: false,
    }
    setContracts(prev => [newContract, ...prev])
    confetti({ particleCount: 80, spread: 60, colors: ['#1e3a5f', '#2563eb'] })
    resetWizard()
  }

  /* Signature */
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    ctx.beginPath()
    const r = c.getBoundingClientRect()
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
    setIsDrawing(true)
  }
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    const r = c.getBoundingClientRect()
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top)
    ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
    ctx.stroke()
  }
  const stopDraw = () => setIsDrawing(false)
  const clearCanvas = () => {
    const c = canvasRef.current; if (!c) return
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  }

  const handleSignConfirm = () => {
    if (!signContract) return
    setContracts(prev => prev.map(c => c.id === signContract.id ? { ...c, status: 'firmado', signedByLandlord: true, signedByTenant: true } : c))
    if (viewingContract?.id === signContract.id) {
      setViewingContract(prev => prev ? { ...prev, status: 'firmado', signedByLandlord: true, signedByTenant: true } : null)
    }
    confetti({ particleCount: 150, spread: 80 })
    setShowSignature(false)
    setSignContract(null)
  }

  /* Delete */
  const handleDelete = (id: string) => {
    if (!confirm(t('confirm_delete'))) return
    setContracts(prev => prev.filter(c => c.id !== id))
    if (viewingContract?.id === id) setViewingContract(null)
  }

  /* Download PDF */
  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await fetch(`/api/contracts/${id}/pdf`, { method: 'GET' })
      if (!res.ok) throw new Error('Error al generar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrato-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(`/api/contracts/${id}/pdf`, '_blank')
    }
  }

  /* Chat */
  const handleChatSend = () => {
    if (!chatInput.trim() || !viewingContract || isAiThinking) return
    const q = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', text: q }])
    setChatInput('')
    setIsAiThinking(true)
    setTimeout(() => {
      const answer = findAnswer(q, viewingContract.contractText)
      setChatMessages(prev => [...prev, { role: 'ai', text: answer }])
      setIsAiThinking(false)
    }, 1200)
  }

  const statusCount = (s: ContractStatus) => contracts.filter(c => c.status === s).length

  const btnCls = 'px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('contracts_label')}</p>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mt-0.5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> {t('page_title')}
          </h1>
        </div>
        <button onClick={() => setShowWizard(true)} className={`${btnCls} gap-2 shadow-[0_2px_8px_rgba(37,99,235,0.2)]`}>
          <Sparkles className="w-4 h-4" /> {t('generate_ai')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['todos'] as const).map(k => {
          const count = k === 'todos' ? contracts.length : statusCount(k)
          return (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === k ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(37,99,235,0.15)]' : 'border-border bg-card hover:border-primary/30'
              }`}>
              <span className="text-xs text-muted-foreground">{k === 'todos' ? t('filter_all') : statusLabel(k as ContractStatus, t)}</span>
              <p className="text-lg font-black text-foreground mt-0.5">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-card border border-border text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </div>

      {/* Contract cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('empty_state')}</p>
          <button onClick={() => setShowWizard(true)} className={`${btnCls} mt-4`}>
            <Sparkles className="w-4 h-4" /> {t('generate_first')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map(c => {
              const StatusIcon = STATUS_ICONS[c.status]
              return (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
                  onClick={() => { setViewingContract(c); setChatMessages([]) }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm truncate">{c.property}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" /> {c.tenant}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${STATUS_STYLES[c.status]}`}>
                      <StatusIcon className="w-3 h-3" /> {statusLabel(c.status, t)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{c.amount}{t('per_month')}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="w-3 h-3" />
                      <span>{c.startDate} → {c.endDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60">
                    <button onClick={e => { e.stopPropagation(); setViewingContract(c); setChatMessages([]) }}
                      className="text-[10px] text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                      <Eye className="w-3 h-3" /> {t('view')}
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDownloadPdf(c.id) }}
                      className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 hover:text-foreground cursor-pointer">
                      <Download className="w-3 h-3" /> {t('download_pdf')}
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }}
                      className="text-[10px] text-destructive font-semibold flex items-center gap-1 hover:text-destructive/80 cursor-pointer ml-auto">
                      <Trash2 className="w-3 h-3" /> {t('delete')}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* AI Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-[0_25px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> {t('wizard_title')}
              </h3>
              <button onClick={resetWizard} className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex px-5 pt-4 gap-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= wizardStep ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {wizardStep === 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-3">{t('step_property')}</p>
                  <div className="space-y-2">
                    {MOCK_PROPERTIES.map(p => (
                      <button key={p.id} type="button" onClick={() => setSelProperty(p.id)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                          selProperty === p.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                        }`}>
                        <Building className="w-4 h-4 inline mr-2" /> {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 1 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-3">{t('step_tenant')}</p>
                  <div className="space-y-2">
                    {MOCK_TENANTS.map(tn => (
                      <button key={tn.id} type="button" onClick={() => setSelTenant(tn.id)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                          selTenant === tn.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                        }`}>
                        <User className="w-4 h-4 inline mr-2" /> {tn.name}
                        <span className="text-[10px] text-muted-foreground ml-2">{tn.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground mb-3">{t('step_details')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{t('rent_label')}</label>
                      <input type="number" value={wizRent} onChange={e => setWizRent(e.target.value)}
                        placeholder="$ 1,500,000" className="w-full bg-background border border-input text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{t('deposit_label')}</label>
                      <input type="number" value={wizDeposit} onChange={e => setWizDeposit(e.target.value)}
                        placeholder="$ 1,500,000" className="w-full bg-background border border-input text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{t('start_label')}</label>
                      <input type="date" value={wizStart} onChange={e => setWizStart(e.target.value)}
                        className="w-full bg-background border border-input text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{t('end_label')}</label>
                      <input type="date" value={wizEnd} onChange={e => setWizEnd(e.target.value)}
                        className="w-full bg-background border border-input text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{t('payday_label')}</label>
                      <input type="number" min="1" max="30" value={wizPayDay} onChange={e => setWizPayDay(e.target.value)}
                        className="w-full bg-background border border-input text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  {isGenerating ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-sm font-semibold text-foreground">{t('generating')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('generating_desc')}</p>
                    </div>
                  ) : generatedText ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" /> {t('generated_success')}
                      </p>
                      <pre className="text-[10px] text-foreground bg-muted/50 p-3 rounded-lg border border-border/60 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto leading-relaxed">
                        {generatedText}
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Wizard actions */}
            <div className="p-5 border-t border-border flex items-center justify-between">
              <button type="button" onClick={() => wizardStep > 0 && setWizardStep(s => s - 1)}
                disabled={wizardStep === 0}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> {t('back')}
              </button>

              {wizardStep < 2 ? (
                <button type="button" onClick={() => {
                  if (wizardStep === 0 && selProperty) setWizardStep(1)
                  else if (wizardStep === 1 && selTenant) setWizardStep(2)
                }}
                  disabled={wizardStep === 0 && !selProperty || wizardStep === 1 && !selTenant}
                  className={btnCls}>
                  {t('next')} <ChevronRight className="w-4 h-4" />
                </button>
              ) : wizardStep === 2 ? (
                <button type="button" onClick={handleGenerateAI}
                  disabled={!wizRent || !wizStart}
                  className={btnCls}>
                  <Sparkles className="w-4 h-4" /> {t('generate_with_ai')}
                </button>
              ) : (
                <button type="button" onClick={handleSaveGenerated}
                  className={btnCls}>
                  <Check className="w-4 h-4" /> {t('save_contract')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Viewer + Chat Split */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl w-full max-w-5xl max-h-[85vh] shadow-[0_25px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm text-foreground">{t('contract_prefix')} {viewingContract.property}</h3>
                <p className="text-[10px] text-muted-foreground">{viewingContract.tenant} — {viewingContract.amount}{t('per_month')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${STATUS_STYLES[viewingContract.status]}`}>
                  {statusLabel(viewingContract.status, t)}
                </span>
                {viewingContract.status !== 'firmado' && (
                  <button onClick={() => { setSignContract(viewingContract); setShowSignature(true); setTimeout(clearCanvas, 100) }}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1">
                    <PenSquare className="w-3 h-3" /> {t('sign_now')}
                  </button>
                )}
                <button onClick={() => setViewingContract(null)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split: left contract, right chat */}
            <div className="flex flex-1 min-h-0">
              {/* Contract text */}
              <div className="flex-1 overflow-y-auto p-6 bg-white/50">
                <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {viewingContract.contractText}
                </pre>
              </div>

              {/* Chat panel */}
              <div className="w-80 border-l border-border flex flex-col bg-muted/20">
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-primary" /> {t('ai_chat')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t('chat_desc')}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-[10px] text-muted-foreground">{t('chat_empty')}</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl p-2.5 text-[11px] ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border/60 text-foreground'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAiThinking && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border/60 rounded-xl p-3">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                      placeholder={t('chat_placeholder')}
                      className="flex-1 bg-background border border-input text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-ring" />
                    <button onClick={handleChatSend} disabled={!chatInput.trim() || isAiThinking}
                      className="p-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground rounded-lg transition-all cursor-pointer">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignature && signContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-[0_25px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <PenSquare className="w-4 h-4 text-primary" /> {t('sign_title')}
              </h3>
              <button onClick={() => setShowSignature(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t('sign_disclaimer')}</span>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">{t('draw_signature')}</p>
                <div className="bg-white border-2 border-border rounded-xl overflow-hidden h-40">
                  <canvas ref={canvasRef} width={460} height={160}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    className="w-full h-full cursor-crosshair" />
                </div>
                <button type="button" onClick={clearCanvas}
                  className="text-[10px] text-muted-foreground hover:text-foreground font-semibold mt-1 cursor-pointer">
                  {t('clear_signature')}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSignature(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-all cursor-pointer">
                  {t('cancel')}
                </button>
                <button type="button" onClick={handleSignConfirm}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <FileSignature className="w-4 h-4" /> {t('confirm_sign')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
