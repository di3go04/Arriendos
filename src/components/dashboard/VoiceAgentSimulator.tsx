'use client'

import { useTranslations } from 'next-intl'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Phone, Mic, Loader2, CheckCircle, XCircle, MessageSquare, Clock, DollarSign, AlertTriangle } from 'lucide-react'

type CallStatus = 'idle' | 'calling' | 'connected' | 'negotiating' | 'completed' | 'failed'

const CALL_DURATION_SECONDS = 154
const MOCK_TRANSCRIPT = [
  { speaker: 'IA', text: 'Hola, soy el asistente virtual de RentNow. Lo llamo para recordarle que su pago de canon de arrendamiento está pendiente.' },
  { speaker: 'IA', text: 'El valor pendiente es de $1,500,000 COP con vencimiento el 15 de este mes.' },
  { speaker: 'IA', text: '¿Le gustaría realizar el pago ahora, o prefiere comprometerse a una fecha?' },
]

const simulationResponses = [
  { textKey: 'sim_response_payment', outcome: 'payment' },
  { textKey: 'sim_response_commitment', outcome: 'commitment' },
  { textKey: 'sim_response_escalate', outcome: 'escalate' },
]

const finalMessages: Record<string, string> = {
  payment: 'Pago confirmado — enlace de WhatsApp enviado',
  commitment: 'Compromiso registrado — recordatorio programado',
  escalate: 'Caso escalado a asesor humano',
}

export function VoiceAgentSimulator() {
  const t = useTranslations('VOICE_AGENT_SIMULATOR')
  const [status, setStatus] = useState<CallStatus>('idle')
  const [result, setResult] = useState<{ type: 'payment' | 'commitment' | 'escalate' } | null>(null)
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callDuration, setCallDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCall = useCallback(() => {
    const phone = phoneNumber.trim() || '+57 300 000 0000'
    setStatus('calling')
    setResult(null)
    setTranscript([])
    setCallDuration(0)
    setShowTranscript(false)

    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    setTimeout(() => {
      setStatus('connected')
      setTranscript([MOCK_TRANSCRIPT[0]])
      setTimeout(() => {
        setTranscript(prev => [...prev, MOCK_TRANSCRIPT[1]])
        setTimeout(() => {
          setStatus('negotiating')
          setTranscript(prev => [...prev, MOCK_TRANSCRIPT[2]])
          if (intervalRef.current) clearInterval(intervalRef.current)
        }, 2500)
      }, 2500)
    }, 3000 + Math.random() * 2000)
  }, [phoneNumber])

  const handleResponse = useCallback((outcome: 'payment' | 'commitment' | 'escalate') => {
    setResult({ type: outcome })
    setStatus('completed')
    setTranscript(prev => [...prev, { speaker: 'IA', text: finalMessages[outcome] }])
    setShowTranscript(true)
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setTranscript([])
    setCallDuration(0)
    setShowTranscript(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          {t('simulator_title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('simulator_desc')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Call status visual */}
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-background p-6 text-center">
          <motion.div
            animate={status === 'calling' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
          >
            {(() => {
              switch (status) {
                case 'idle': return <Phone className="h-8 w-8 text-primary" />
                case 'calling': return <Loader2 className="h-8 w-8 text-primary animate-spin" />
                case 'connected': return <Mic className="h-8 w-8 text-success" />
                case 'negotiating': return <MessageSquare className="h-8 w-8 text-amber-500" />
                case 'completed': return result?.type === 'payment' ? <CheckCircle className="h-8 w-8 text-success" /> : <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                case 'failed': return <XCircle className="h-8 w-8 text-error" />
              }
            })()}
          </motion.div>

          <p className="font-medium text-foreground">
            {status === 'idle' && t('status_idle')}
            {status === 'calling' && t('status_calling')}
            {status === 'connected' && t('status_connected')}
            {status === 'negotiating' && t('status_negotiating')}
            {status === 'completed' && t('status_completed')}
            {status === 'failed' && 'Llamada fallida'}
          </p>

          {(status === 'calling' || status === 'connected') && (
            <p className="text-xs text-muted-foreground mt-1">
              Llamando al {phoneNumber || '+57 300 000 0000'}...
            </p>
          )}

          {status === 'completed' && callDuration > 0 && (
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(callDuration)}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> $1,500,000 COP
              </span>
            </div>
          )}
        </div>

        {/* Phone input */}
        {status === 'idle' && (
          <div className="space-y-2">
            <Input
              label="Número de teléfono"
              placeholder="+57 300 000 0000"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              type="tel"
            />
          </div>
        )}

        {/* Live transcript during call */}
        {(status === 'connected' || status === 'negotiating') && (
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            <AnimatePresence>
              {transcript.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
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

        {/* Completed transcript toggle */}
        {status === 'completed' && showTranscript && (
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

        {/* Actions */}
        {status === 'idle' && (
          <Button onClick={startCall} className="w-full gap-2">
            <Phone className="h-4 w-4" /> {t('start_call')}
          </Button>
        )}

        {status === 'negotiating' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">{t('simulate_response_label')}</p>
            <div className="grid grid-cols-1 gap-2">
              {simulationResponses.map(r => (
                <Button
                  key={r.outcome}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2.5"
                  onClick={() => handleResponse(r.outcome as 'payment' | 'commitment' | 'escalate')}
                >
                  {t(r.textKey)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="space-y-3">
            <div className={`rounded-lg border p-3 text-sm ${
              result?.type === 'payment' ? 'border-success/30 bg-success/5 text-success' :
              result?.type === 'commitment' ? 'border-amber-200 bg-amber-50 text-amber-700' :
              'border-red-200 bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {result?.type === 'payment' && <CheckCircle className="h-4 w-4 shrink-0" />}
                {result?.type === 'commitment' && <Clock className="h-4 w-4 shrink-0" />}
                {result?.type === 'escalate' && <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span className="font-medium">
                  {result?.type === 'payment' && t('result_payment')}
                  {result?.type === 'commitment' && t('result_commitment')}
                  {result?.type === 'escalate' && t('result_escalate')}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-80">
                Duración: {formatDuration(callDuration)} — Monto: $1,500,000 COP
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTranscript(!showTranscript)}>
                <MessageSquare className="h-4 w-4" /> {showTranscript ? 'Ocultar' : 'Ver'} transcripción
              </Button>
              <Button variant="outline" className="flex-1" onClick={reset}>
                {t('new_simulation')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
