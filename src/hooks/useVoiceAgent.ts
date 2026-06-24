import { useState, useCallback } from 'react'

interface VoiceAgentHook {
  callStatus: 'idle' | 'calling' | 'connected' | 'completed' | 'failed'
  startCall: (contractId: string, tenantPhone: string) => Promise<void>
  transcript: { speaker: string; text: string }[]
  loading: boolean
  error: string | null
}

export function useVoiceAgent(): VoiceAgentHook {
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'completed' | 'failed'>('idle')
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCall = useCallback(async (contractId: string, tenantPhone: string) => {
    setLoading(true)
    setError(null)
    setCallStatus('calling')
    setTranscript([])

    try {
      const res = await fetch('/api/vapi/start-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, tenantPhone }),
      })
      const data = await res.json()

      if (data.ok) {
        setCallStatus('connected')
        setTranscript(data.transcript || [])
        setCallStatus('completed')
      } else {
        setCallStatus('failed')
        setError(data.error || 'Error al iniciar llamada')
      }
    } catch (err) {
      setCallStatus('failed')
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  return { callStatus, startCall, transcript, loading, error }
}
