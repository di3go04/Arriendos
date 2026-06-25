'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Building2, Users, CreditCard, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Metric {
  icon: typeof Building2
  label: string
  value: string
  change: string
  changeType: 'up' | 'down' | 'neutral'
  color: string
}

interface DashboardSummary {
  totalProperties: number
  activeContracts: number
  monthlyRentTotal: number
  paidTotal: number
  pendingTotal: number
  occupancyRate: number
}

const defaultSummary: DashboardSummary = {
  totalProperties: 0,
  activeContracts: 0,
  monthlyRentTotal: 0,
  paidTotal: 0,
  pendingTotal: 0,
  occupancyRate: 0,
};

export function MetricsCards() {
  const t = useTranslations('metrics')
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch('/api/app/summary')
        if (res.ok) {
          const data = await res.json()
          setSummary(data.summary || defaultSummary)
        }
      } catch {
        // Fallback to defaults
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value}`
  }

  const metrics: Metric[] = [
    {
      icon: Building2,
      label: t('active_properties') || 'Propiedades',
      value: loading ? '...' : String(summary.totalProperties),
      change: `${summary.activeContracts} contratos activos`,
      changeType: summary.activeContracts > 0 ? 'up' : 'neutral',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Users,
      label: t('tenants') || 'Inquilinos',
      value: loading ? '...' : String(summary.activeContracts),
      change: `${summary.occupancyRate}% ocupación`,
      changeType: summary.occupancyRate >= 50 ? 'up' : 'down',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: CreditCard,
      label: t('monthly_collection') || 'Recaudo mensual',
      value: loading ? '...' : formatCurrency(summary.monthlyRentTotal),
      change: 'Próximo vencimiento',
      changeType: 'neutral',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: DollarSign,
      label: t('mrr') || 'Ingresos pagados',
      value: loading ? '...' : formatCurrency(summary.paidTotal),
      change: '+100% vs 0',
      changeType: summary.paidTotal > 0 ? 'up' : 'neutral',
      color: 'from-amber-500 to-amber-600',
    },
    {
      icon: TrendingUp,
      label: t('occupancy') || 'Ocupación',
      value: loading ? '...' : `${summary.occupancyRate}%`,
      change: `${summary.activeContracts} contratos activos`,
      changeType: summary.occupancyRate >= 50 ? 'up' : 'down',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: AlertTriangle,
      label: t('overdue_payments') || 'Pagos vencidos',
      value: loading ? '...' : String(Math.ceil(summary.pendingTotal / Math.max(summary.monthlyRentTotal, 1))),
      change: `$${summary.pendingTotal.toLocaleString()} por cobrar`,
      changeType: summary.pendingTotal > 0 ? 'down' : 'up',
      color: 'from-red-500 to-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, i) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`rounded-lg bg-gradient-to-br ${metric.color} p-2 text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-medium ${
                    metric.changeType === 'up' ? 'text-success' :
                    metric.changeType === 'down' ? 'text-error' :
                    'text-muted-foreground'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
