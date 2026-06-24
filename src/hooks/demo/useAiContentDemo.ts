'use client'

import { useState, useCallback } from 'react'
import { getDemoContractHTML, getDemoMarketingContent } from '@/lib/demo-fallbacks'

type AiContractState =
  | { phase: 'idle' }
  | { phase: 'generating'; progress: number; message: string }
  | { phase: 'success'; html: string; tokens: number; cost: string }
  | { phase: 'error'; error: string }

type AiMarketingState =
  | { phase: 'idle' }
  | { phase: 'generating'; platform?: string }
  | { phase: 'success'; content: ReturnType<typeof getDemoMarketingContent> }
  | { phase: 'error'; error: string }

export function useAiContractDemo() {
  const [state, setState] = useState<AiContractState>({ phase: 'idle' })

  const generate = useCallback(async (variables: Record<string, string>) => {
    setState({ phase: 'generating', progress: 0, message: 'Analizando plantilla legal...' })
    await new Promise((r) => setTimeout(r, 800))

    setState({ phase: 'generating', progress: 40, message: 'Aplicando legislación local...' })
    await new Promise((r) => setTimeout(r, 700))

    setState({ phase: 'generating', progress: 70, message: 'Generando cláusulas con IA (Gemini 2.0 Flash)...' })
    await new Promise((r) => setTimeout(r, 1000))

    const html = getDemoContractHTML(variables)
    setState({
      phase: 'success',
      html,
      tokens: Math.floor(Math.random() * 500) + 800,
      cost: '$0.00015',
    })
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  return { state, generate, reset }
}

export function useAiMarketingDemo() {
  const [state, setState] = useState<AiMarketingState>({ phase: 'idle' })

  const generate = useCallback(async (platform?: string) => {
    setState({ phase: 'generating', platform })
    await new Promise((r) => setTimeout(r, 1500))

    const content = getDemoMarketingContent()
    setState({ phase: 'success', content })
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  return { state, generate, reset }
}
