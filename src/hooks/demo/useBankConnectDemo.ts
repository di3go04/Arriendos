'use client'

import { useState, useCallback } from 'react'
import { getDemoBelvoLink, getDemoBelvoAccounts, getDemoBelvoTransactions, getDemoSolvencyScore } from '@/lib/demo-fallbacks'

type BankState =
  | { phase: 'idle' }
  | { phase: 'connecting'; bank: string }
  | { phase: 'fetching'; message: string; progress: number }
  | { phase: 'synced'; transactions: number; accounts: number }
  | { phase: 'evaluating'; message: string }
  | { phase: 'completed'; score: ReturnType<typeof getDemoSolvencyScore> }
  | { phase: 'error'; error: string }

export function useBankConnectDemo() {
  const [state, setState] = useState<BankState>({ phase: 'idle' })

  const connectAndEvaluate = useCallback(async (userId: string) => {
    setState({ phase: 'connecting', bank: 'Banco Galicia' })
    await new Promise((r) => setTimeout(r, 2000))

    setState({ phase: 'fetching', message: 'Conectando con tu banco vía Belvo...', progress: 20 })
    await new Promise((r) => setTimeout(r, 1000))

    const link = getDemoBelvoLink(userId)
    setState({ phase: 'fetching', message: 'Sincronizando cuentas bancarias...', progress: 50 })
    await new Promise((r) => setTimeout(r, 1200))

    const accounts = getDemoBelvoAccounts(link.id)
    setState({ phase: 'fetching', message: `Obtenidas ${accounts.length} cuentas`, progress: 70 })
    await new Promise((r) => setTimeout(r, 800))

    const transactions = getDemoBelvoTransactions(link.id)
    setState({ phase: 'synced', transactions: transactions.length, accounts: accounts.length })
    await new Promise((r) => setTimeout(r, 500))

    setState({ phase: 'evaluating', message: 'Calculando score de solvencia...' })
    await new Promise((r) => setTimeout(r, 1500))

    const score = getDemoSolvencyScore(userId)
    setState({ phase: 'completed', score })
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  return { state, connectAndEvaluate, reset }
}
