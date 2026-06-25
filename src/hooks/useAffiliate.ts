'use client'

import { useState, useCallback } from 'react'

interface AffiliateStats {
  referralCode: string
  totalReferrals: number
  activeReferrals: number
  totalCommission: number
  pendingCommission: number
  conversionRate: number
  referrals: Array<{
    id: string
    name: string
    email: string
    status: string
    commission: number
    date: string
  }>
}

export function useAffiliate() {
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/affiliates')
      if (!res.ok) throw new Error('Error al obtener estadísticas')
      const data = await res.json()
      setStats(data.data || data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  const generateReferralLink = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const code = `RENTNOW_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    return {
      code,
      link: `${baseUrl}/register?ref=${code}`,
    }
  }, [])

  const trackReferral = useCallback(async (referralCode: string, action: string) => {
    try {
      await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode, action }),
      })
    } catch {
      // Silent fail for tracking
    }
  }, [])

  return { stats, fetchStats, generateReferralLink, trackReferral, loading, error }
}
