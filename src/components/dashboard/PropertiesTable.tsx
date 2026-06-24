'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building2, Plus, Edit2, MoreHorizontal, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Property {
  id: string
  title: string
  city: string
  type: string
  status: string
  bedrooms: number
  bathrooms: number
  area_sqm: number
  monthly_rent: number
  description: string
  amenities: string[]
  image_urls: string[]
  created_at: string
}

export function PropertiesTable() {
  const t = useTranslations('properties_table')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch('/api/properties')
        if (res.ok) {
          const data = await res.json()
          setProperties(data.properties || [])
        }
      } catch {
        // Keep empty array
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value}`
  }

  const handleExport = () => {
    const csv = [t('csv_header')]
    properties.forEach(p => csv.push(`${p.title},${p.city},${p.type},${p.status},${p.bedrooms}hab,${formatCurrency(p.monthly_rent)}`))
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = t('csv_filename') || 'propiedades.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t('title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Cargando...' : t('count', { count: properties.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>{t('export_csv')}</Button>
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> {t('new')}</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando propiedades...</div>
        ) : properties.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No hay propiedades registradas. Crea tu primera propiedad para empezar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">{t('header_property')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('header_city')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('header_type')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('header_status')}</th>
                  <th className="text-center px-4 py-3 font-medium">Habitaciones</th>
                  <th className="text-right px-4 py-3 font-medium">{t('header_monthly_income')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('header_updated')}</th>
                  <th className="text-right px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {properties.map(p => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.city}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{p.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'disponible' || p.status === 'ocupado' ? 'bg-success/10 text-success' : 'bg-red-100 text-red-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'disponible' || p.status === 'ocupado' ? 'bg-success' : 'bg-red-500'}`} />
                        {p.status === 'disponible' ? 'Disponible' : p.status === 'ocupado' ? 'Ocupado' : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{p.bedrooms || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.monthly_rent)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
