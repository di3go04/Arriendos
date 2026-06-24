'use client'

import { useState, useCallback } from 'react'
import { getDemoKycResult } from '@/lib/demo-fallbacks'

type KycState =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'processing'; message: string }
  | { phase: 'success'; result: ReturnType<typeof getDemoKycResult> }
  | { phase: 'error'; error: string }

export function useKycDemo() {
  const [state, setState] = useState<KycState>({ phase: 'idle' })

  const startVerification = useCallback(async (documentType: string) => {
    setState({ phase: 'uploading', progress: 0 })

    // Simulate upload progress
    for (let p = 10; p <= 90; p += 20) {
      await new Promise((r) => setTimeout(r, 300))
      setState({ phase: 'uploading', progress: p })
    }

    setState({ phase: 'processing', message: 'Analizando documento con OCR...' })
    await new Promise((r) => setTimeout(r, 800))

    setState({ phase: 'processing', message: 'Verificando selfie contra documento...' })
    await new Promise((r) => setTimeout(r, 700))

    setState({ phase: 'processing', message: 'Validando autenticidad biométrica...' })
    await new Promise((r) => setTimeout(r, 600))

    const result = getDemoKycResult()
    setState({ phase: 'success', result })
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  return { state, startVerification, reset }
}
