'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { PropertiesTable } from '@/components/dashboard/PropertiesTable'
import { VoiceAgentSimulator } from '@/components/dashboard/VoiceAgentSimulator'
import { DashboardMap } from '@/components/dashboard/DashboardMap'
import dynamic from 'next/dynamic'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false, loading: () => <SkeletonLoader /> })
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })

const MONTH_KEYS = ['month_jan', 'month_feb', 'month_mar', 'month_apr', 'month_may', 'month_jun'] as const

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const chartData = useMemo(() => [
    { month: t(MONTH_KEYS[0]), ingresos: 45, ocupacion: 82 },
    { month: t(MONTH_KEYS[1]), ingresos: 52, ocupacion: 85 },
    { month: t(MONTH_KEYS[2]), ingresos: 48, ocupacion: 80 },
    { month: t(MONTH_KEYS[3]), ingresos: 61, ocupacion: 87 },
    { month: t(MONTH_KEYS[4]), ingresos: 59, ocupacion: 84 },
    { month: t(MONTH_KEYS[5]), ingresos: 67, ocupacion: 90 },
  ], [t])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('general_summary')}</p>
      </div>

      <MetricsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold">{t('income_occupation')}</h3>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <Tooltip />
                    <Area type="monotone" dataKey="ingresos" stroke="#2563EB" fill="url(#ingresosGrad)" strokeWidth={2} name={t('chart_income')} />
                    <Area type="monotone" dataKey="ocupacion" stroke="#10B981" fill="none" strokeWidth={2} name={t('chart_occupation')} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <VoiceAgentSimulator />
      </div>

      <PropertiesTable />

      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-lg">🗺️</span>
            {t('map_title')}
          </h3>
        </CardHeader>
        <CardContent>
          <DashboardMap />
        </CardContent>
      </Card>
    </div>
  )
}
