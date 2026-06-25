'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PropertiesTable } from '@/components/dashboard/PropertiesTable'
import { DashboardMap } from '@/components/dashboard/DashboardMap'
import { LayoutGrid, Map } from 'lucide-react'

export default function PropertiesPage() {
  const tn = useTranslations('nav')
  const t = useTranslations('properties_page')
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tn('properties')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Lista
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === 'map'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            Mapa
          </button>
        </div>
      </div>

      {view === 'list' ? <PropertiesTable /> : <DashboardMap />}
    </div>
  )
}
