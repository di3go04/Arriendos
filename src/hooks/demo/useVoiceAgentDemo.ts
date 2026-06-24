'use client'

import { useState, useCallback } from 'react'
import { getDemoVoiceCallResult } from '@/lib/demo-fallbacks'

type CallState =
  | { phase: 'idle' }
  | { phase: 'dialing'; number: string }
  | { phase: 'ringing'; elapsed: number }
  | { phase: 'connected'; message: string }
  | { phase: 'talking'; transcript: string }
  | { phase: 'completed'; result: ReturnType<typeof getDemoVoiceCallResult> }
  | { phase: 'error'; error: string }

export function useVoiceAgentDemo() {
  const [state, setState] = useState<CallState>({ phase: 'idle' })

  const startCall = useCallback(async (tenantName: string, tenantPhone: string, debtAmount: number) => {
    setState({ phase: 'dialing', number: tenantPhone })
    await new Promise((r) => setTimeout(r, 1500))

    setState({ phase: 'ringing', elapsed: 0 })
    const ringInterval = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'ringing') return prev
        return { ...prev, elapsed: prev.elapsed + 1 }
      })
    }, 1000)

    await new Promise((r) => setTimeout(r, 4000))
    clearInterval(ringInterval)

    setState({ phase: 'connected', message: 'Llamada respondida' })
    await new Promise((r) => setTimeout(r, 1000))

    const partialTranscript = [
      `Asistente: Hola ${tenantName}, soy el asistente de cobranza de RentNow.`,
      `Te llamo porque tu pago de $${debtAmount} está pendiente.`,
      `${tenantName}: Sí, lo sé. Disculpa el retraso.`,
      `Asistente: ¿Te es posible realizar el pago el día de hoy?`,
      `${tenantName}: No puedo hoy, pero puedo pagar el viernes.`,
    ]

    for (const line of partialTranscript) {
      setState({ phase: 'talking', transcript: line })
      await new Promise((r) => setTimeout(r, 1200))
    }

    const result = getDemoVoiceCallResult(tenantName, debtAmount)
    setState({ phase: 'completed', result })
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  return { state, startCall, reset }
}
