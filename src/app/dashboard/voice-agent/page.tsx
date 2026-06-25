'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Phone, Mic, Loader2, CheckCircle, XCircle,
  Calendar, Clock, DollarSign, PhoneCall, BarChart3,
  Play, Settings, RefreshCw, MessageSquare, PhoneOff, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { useTranslations } from 'next-intl'

interface ScheduledCall {
  id: string
  tenantName: string
  tenantPhone: string
  propertyName: string
  debtAmount: number
  dueDate: string
  status: 'pending' | 'completed' | 'failed'
  outcome?: string
  duration?: number
}

const mockScheduledCalls: ScheduledCall[] = [
  { id: '1', tenantName: 'Carlos López', tenantPhone: '+57 300 111 2233', propertyName: 'Edificio Mediterráneo', debtAmount: 1500000, dueDate: '2026-07-15', status: 'pending' },
  { id: '2', tenantName: 'María García', tenantPhone: '+57 310 444 5566', propertyName: 'Casa Laureles', debtAmount: 3200000, dueDate: '2026-07-01', status: 'pending' },
  { id: '3', tenantName: 'Andrés Medina', tenantPhone: '+57 320 777 8899', propertyName: 'Coliving El Poblado', debtAmount: 1200000, dueDate: '2026-06-01', status: 'completed', outcome: 'commitment', duration: 187 },
  { id: '4', tenantName: 'Laura Jiménez', tenantPhone: '+57 301 555 6677', propertyName: 'Oficina Centro Ejecutivo', debtAmount: 2500000, dueDate: '2026-06-20', status: 'completed', outcome: 'payment', duration: 203 },
  { id: '5', tenantName: 'Pedro Ramírez', tenantPhone: '+57 315 888 9900', propertyName: 'Apartamento El Poblado', debtAmount: 1800000, dueDate: '2026-07-05', status: 'failed', outcome: 'escalate' },
]

const MOCK_TRANSCRIPT = [
  { speaker: 'IA', text: 'Hola, soy el asistente virtual de RentNow. Lo llamo para recordarle que su pago de canon de arrendamiento está pendiente.' },
  { speaker: 'IA', text: 'El valor pendiente es de $1,500,000 COP con vencimiento el 15 de este mes.' },
  { speaker: 'IA', text: '¿Le gustaría realizar el pago ahora, o prefiere comprometerse a una fecha?' },
]

const finalMessages: Record<string, string> = {
  payment: 'Pago confirmado — enlace de WhatsApp enviado',
  commitment: 'Compromiso registrado — recordatorio programado',
  escalate: 'Caso escalado a asesor humano',
}

export default function VoiceAgentPage() {
  const t = useTranslations('voice_agent')
  const { startCall: apiStartCall, transcript: apiTranscript, loading: apiLoading, error: apiError } = useVoiceAgent()
  const [scheduledCalls] = useState<ScheduledCall[]>(mockScheduledCalls)
  const [selectedCall, setSelectedCall] = useState<ScheduledCall | null>(null)
  const [customPhone, setCustomPhone] = useState('')
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'negotiating' | 'completed' | 'failed'>('idle')
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const [callResult, setCallResult] = useState<{ type: 'payment' | 'commitment' | 'escalate' } | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [showFullTranscript, setShowFullTranscript] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [assistantConfig, setAssistantConfig] = useState({
    voice: 'es-LATAM',
    tone: 'professional',
    maxDuration: 120,
    retryAttempts: 3,
  })

  const [stats] = useState({
    totalCalls: 47,
    completed: 38,
    paymentsCollected: 28,
    commitments: 10,
    collectionRate: 81,
    avgDuration: '2:35',
  })

  const handleStartCall = useCallback(async () => {
    const phone = customPhone || selectedCall?.tenantPhone || '+57 300 000 0000'
    setCallStatus('calling')
    setCallResult(null)
    setTranscript([])
    setCallDuration(0)
    setShowFullTranscript(false)

    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    try {
      await apiStartCall(selectedCall?.id || 'demo', phone)

      setTimeout(() => {
        setCallStatus('connected')
        setTranscript([MOCK_TRANSCRIPT[0]])
        setTimeout(() => {
          setTranscript(prev => [...prev, MOCK_TRANSCRIPT[1]])
          setTimeout(() => {
            setCallStatus('negotiating')
            setTranscript(prev => [...prev, MOCK_TRANSCRIPT[2]])
            if (intervalRef.current) clearInterval(intervalRef.current)
          }, 2500)
        }, 2500)
      }, 3000 + Math.random() * 2000)
    } catch {
      setCallStatus('failed')
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [customPhone, selectedCall, apiStartCall])

  const handleResponse = useCallback((outcome: 'payment' | 'commitment' | 'escalate') => {
    setCallResult({ type: outcome })
    setCallStatus('completed')
    setTranscript(prev => [...prev, { speaker: 'IA', text: finalMessages[outcome] }])
  }, [])

  const resetCall = useCallback(() => {
    setCallStatus('idle')
    setCallResult(null)
    setTranscript([])
    setCallDuration(0)
    setShowFullTranscript(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const statusConfig: Record<string, { icon: any; text: string; color: string }> = {
    idle: { icon: Phone, text: t('status_idle'), color: 'text-muted-foreground' },
    calling: { icon: Loader2, text: t('status_calling'), color: 'text-primary' },
    connected: { icon: Mic, text: t('status_connected'), color: 'text-success' },
    negotiating: { icon: MessageSquare, text: 'Negociando...', color: 'text-amber-500' },
    completed: { icon: CheckCircle, text: t('status_completed'), color: 'text-success' },
    failed: { icon: XCircle, text: t('status_failed'), color: 'text-error' },
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: PhoneCall, label: t('total_calls'), value: stats.totalCalls.toString(), color: 'from-blue-500 to-blue-600' },
          { icon: CheckCircle, label: t('completed_calls'), value: stats.completed.toString(), color: 'from-green-500 to-green-600' },
          { icon: DollarSign, label: t('payments_collected'), value: stats.paymentsCollected.toString(), color: 'from-purple-500 to-purple-600' },
          { icon: Calendar, label: t('commitments'), value: stats.commitments.toString(), color: 'from-amber-500 to-amber-600' },
          { icon: BarChart3, label: t('effectiveness'), value: `${stats.collectionRate}%`, color: 'from-emerald-500 to-emerald-600' },
          { icon: Clock, label: t('avg_duration'), value: stats.avgDuration, color: 'from-cyan-500 to-cyan-600' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover>
                <CardContent className="p-4">
                  <div className={`inline-flex rounded-lg bg-gradient-to-br ${stat.color} p-2 text-white mb-2`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Simulator */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    {t('simulator_title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t('simulator_desc')}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings className="h-4 w-4" /> {t('configure')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Call visualization */}
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-background p-8 text-center">
                <motion.div
                  animate={callStatus === 'calling' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
                >
                  {(() => {
                    const StatusIcon = statusConfig[callStatus].icon
                    return <StatusIcon className={`h-10 w-10 ${statusConfig[callStatus].color} ${callStatus === 'calling' ? 'animate-spin' : ''}`} />
                  })()}
                </motion.div>
                <p className="text-lg font-semibold text-foreground">{statusConfig[callStatus].text}</p>
                {callStatus === 'calling' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Llamando al {customPhone || selectedCall?.tenantPhone || '+57 300 000 0000'}...
                  </p>
                )}
                {callStatus === 'completed' && callDuration > 0 && (
                  <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatDuration(callDuration)}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> $1,500,000 COP</span>
                  </div>
                )}
              </div>

              {/* Phone input when idle */}
              {callStatus === 'idle' && (
                <Input
                  label="Número de teléfono (opcional)"
                  placeholder={selectedCall?.tenantPhone || '+57 300 000 0000'}
                  value={customPhone}
                  onChange={e => setCustomPhone(e.target.value)}
                  type="tel"
                />
              )}

              {/* Live transcript */}
              {(callStatus === 'connected' || callStatus === 'negotiating') && (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  <AnimatePresence>
                    {transcript.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex gap-3 ${msg.speaker === 'IA' ? '' : 'flex-row-reverse'}`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          msg.speaker === 'IA' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                        }`}>
                          {msg.speaker === 'IA' ? 'AI' : 'U'}
                        </div>
                        <div className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                          msg.speaker === 'IA' ? 'bg-muted text-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Full transcript on completion */}
              {callStatus === 'completed' && showFullTranscript && (
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg bg-muted/50 p-3">
                  {transcript.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.speaker === 'IA' ? '' : 'flex-row-reverse'}`}>
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        msg.speaker === 'IA' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                      }`}>
                        {msg.speaker === 'IA' ? 'AI' : 'U'}
                      </div>
                      <div className={`rounded-lg px-2.5 py-1.5 text-xs max-w-[80%] ${
                        msg.speaker === 'IA' ? 'bg-muted text-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {callStatus === 'idle' && (
                <Button
                  onClick={handleStartCall}
                  disabled={apiLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Phone className="h-5 w-5" /> {t('start_call')}
                </Button>
              )}

              {callStatus === 'negotiating' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Selecciona la respuesta del inquilino:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Pagar ahora', outcome: 'payment' as const },
                      { label: 'Comprometerse a una fecha', outcome: 'commitment' as const },
                      { label: 'Tengo problemas financieros', outcome: 'escalate' as const },
                    ].map(r => (
                      <Button
                        key={r.outcome}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2.5"
                        onClick={() => handleResponse(r.outcome)}
                      >
                        {r.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {callStatus === 'completed' && (
                <div className="space-y-3">
                  <div className={`rounded-lg border p-3 text-sm ${
                    callResult?.type === 'payment' ? 'border-success/30 bg-success/5 text-success' :
                    callResult?.type === 'commitment' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                    'border-red-200 bg-red-50 text-red-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {callResult?.type === 'payment' && <CheckCircle className="h-4 w-4 shrink-0" />}
                      {callResult?.type === 'commitment' && <Clock className="h-4 w-4 shrink-0" />}
                      {callResult?.type === 'escalate' && <AlertTriangle className="h-4 w-4 shrink-0" />}
                      <span className="font-medium">{callResult?.type && finalMessages[callResult.type]}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">
                      Duración: {formatDuration(callDuration)} — Monto: $1,500,000 COP
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowFullTranscript(!showFullTranscript)}>
                      <MessageSquare className="h-4 w-4" /> {showFullTranscript ? 'Ocultar' : 'Ver'} transcripción
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={resetCall}>
                      <RefreshCw className="h-4 w-4" /> {t('new_call')}
                    </Button>
                  </div>
                </div>
              )}

              {callStatus === 'failed' && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">Error al conectar la llamada</span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{apiError || 'El número no respondió o está ocupado.'}</p>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={resetCall}>
                    <RefreshCw className="h-4 w-4" /> Reintentar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call history */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-primary" />
                {t('call_history')}
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">{t('table_tenant')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('table_property')}</th>
                      <th className="text-right px-4 py-3 font-medium">{t('table_debt')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('table_status')}</th>
                      <th className="text-left px-4 py-3 font-medium">Duración</th>
                      <th className="text-right px-4 py-3 font-medium">{t('table_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {scheduledCalls.map((call, idx) => (
                      <tr
                        key={call.id}
                        className={`transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-primary/5 ${selectedCall?.id === call.id ? 'bg-primary/5' : ''}`}
                        onClick={() => { setSelectedCall(call); setCustomPhone('') }}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">{call.tenantName}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{call.propertyName}</td>
                        <td className="px-4 py-3 text-right font-medium">${call.debtAmount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            call.status === 'completed' ? 'bg-success/10 text-success' :
                            call.status === 'failed' ? 'bg-error/10 text-error' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {call.status === 'completed' ? <CheckCircle className="h-3 w-3" /> :
                             call.status === 'failed' ? <XCircle className="h-3 w-3" /> :
                             <Clock className="h-3 w-3" />}
                            {call.status === 'pending' ? t('status_pending') : call.status === 'completed' ? t('status_completed_call') : t('status_failed_call')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {call.duration ? formatDuration(call.duration) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={call.status === 'pending' ? 'primary' : 'ghost'}
                            disabled={call.status !== 'pending'}
                            onClick={(e) => { e.stopPropagation(); setSelectedCall(call); setCustomPhone('') }}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Config panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {t('assistant_config')}
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('voice_label')}</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={assistantConfig.voice}
                  onChange={e => setAssistantConfig(prev => ({ ...prev, voice: e.target.value }))}
                >
                  <option value="es-LATAM">{t('voice_latam')}</option>
                  <option value="es-MX">{t('voice_mx')}</option>
                  <option value="es-ES">{t('voice_es')}</option>
                  <option value="en-US">{t('voice_en')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('tone_label')}</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={assistantConfig.tone}
                  onChange={e => setAssistantConfig(prev => ({ ...prev, tone: e.target.value }))}
                >
                  <option value="professional">{t('tone_professional')}</option>
                  <option value="friendly">{t('tone_friendly')}</option>
                  <option value="firm">{t('tone_firm')}</option>
                  <option value="empathetic">{t('tone_empathetic')}</option>
                </select>
              </div>

              <Input
                label={t('max_duration')}
                type="number"
                value={assistantConfig.maxDuration}
                onChange={e => setAssistantConfig(prev => ({ ...prev, maxDuration: parseInt(e.target.value) || 120 }))}
              />

              <Input
                label={t('retry_attempts')}
                type="number"
                value={assistantConfig.retryAttempts}
                onChange={e => setAssistantConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))}
              />

              <Button className="w-full gap-2">
                <Play className="h-4 w-4" /> {t('schedule_calls')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">{t('script_title')}</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map(phase => (
                <div key={phase} className="rounded-lg bg-muted p-3 text-sm text-muted-foreground border-l-4 border-l-primary/30 hover:border-l-primary transition-colors">
                  <p className="font-medium text-foreground mb-1">{t(`phase${phase}_title`)}</p>
                  <p>{t(`phase${phase}_text`)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
