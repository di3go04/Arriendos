'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { LocationFilters } from '@/components/Map/LocationFilters'
import { useMapFilters } from '@/hooks/useMapFilters'
import type { FiltersState } from '@/hooks/useMapFilters'
import { useTranslations } from 'next-intl';
import { MapPin, Plus, Home } from 'lucide-react'
import Link from 'next/link'
import type { MapProperty } from '@/components/Map/MapView'

function MapLoader() {
  const t = useTranslations('map_dashboard');
  return (
    <div className="flex h-[500px] w-full items-center justify-center bg-muted rounded-xl">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="text-sm">{t('loading_map')}</span>
      </div>
    </div>
  );
}

const MapComponent = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => <MapLoader />,
})

interface DbProperty {
  id: string
  title: string
  lat: number | null
  lng: number | null
  price: number | null
  monthly_rent: number | null
  type: string
  image_urls: string[] | null
  image_url?: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
}

export default function MapDashboardPage() {
  const { user } = useAuth()
  const t = useTranslations('map_dashboard');

  const formatPropertyType = (type: string | null) => {
    if (!type) return t('property_type_default');
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  const formatPrice = (value: number | null) => {
    if (!value) return t('price_pending');
    return `$${Number(value).toLocaleString('es-CO')}/mes`;
  }

  const [allProperties, setAllProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FiltersState>({ country: '', department: '', city: '' })

  const DEFAULT_COORDS = { lat: 4.711, lng: -74.0721 }

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const fetchProperties = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: dbError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        if (dbError) throw dbError

        if (!cancelled) {
          setAllProperties(data || [])
          setLoading(false)
        }
      } catch (err: any) {
        if (!cancelled) {
          const isSchemaError = err?.code === '42703' || err?.message?.includes('does not exist')
          if (isSchemaError) return
          setError(err.message || 'Error al cargar propiedades')
          setLoading(false)
        }
      }
    }

    fetchProperties()
    return () => { cancelled = true }
  }, [user])

  const { filteredLocations, flyToTarget } = useMapFilters(allProperties as any, filters as any)

  const markers: MapProperty[] = useMemo(() => {
    return filteredLocations.map((p: any) => {
      const jitter = ((p.id?.length ?? 0) % 100) / 100 - 0.5;
      return {
        id: p.id,
        title: p.title,
        lat: p.lat ?? DEFAULT_COORDS.lat + jitter * 0.02,
        lng: p.lng ?? DEFAULT_COORDS.lng + jitter * 0.02,
        price: formatPrice(p.price ?? p.monthly_rent),
        type: formatPropertyType(p.type),
        imageUrl: p.image_url || p.image_urls?.[0] || undefined,
      };
    })
  }, [filteredLocations, DEFAULT_COORDS.lat, DEFAULT_COORDS.lng])

  const center: [number, number] = useMemo(() => {
    if (flyToTarget) return flyToTarget.center
    const withCoords = allProperties.filter((p: any) => p.lat != null && p.lng != null) as any[]
    if (withCoords.length === 0) return [DEFAULT_COORDS.lat, DEFAULT_COORDS.lng]
    const avgLat = withCoords.reduce((s: number, p: any) => s + (p.lat ?? 0), 0) / withCoords.length
    const avgLng = withCoords.reduce((s: number, p: any) => s + (p.lng ?? 0), 0) / withCoords.length
    return [avgLat, avgLng]
  }, [allProperties, flyToTarget, DEFAULT_COORDS.lat, DEFAULT_COORDS.lng])

  const zoom = flyToTarget?.zoom ?? 10

  if (loading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center gap-3 text-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm font-medium">{t('loading_properties')}</span>
        </div>
        <p className="text-xs text-muted-foreground/60">{t('map_loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <MapPin className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  if (allProperties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t('no_properties')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('start_publishing')}
            </p>
          </div>
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('publish_property')}
          </Link>
        </div>
      </div>
    )
  }

  const hasLocationFilter = filters.country || filters.department || filters.city

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('properties_count', { count: markers.length, total: allProperties.length })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasLocationFilter && (
            <button
              onClick={() => setFilters({ country: '', department: '', city: '' })}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t('clear_filters')}
            </button>
          )}
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            {t('manage')}
          </Link>
        </div>
      </div>

      <LocationFilters filters={filters} onChange={setFilters} />

      <div className="rounded-xl border overflow-hidden shadow-sm">
        <MapComponent
          properties={markers}
          center={center}
          zoom={zoom}
          height={500}
          onMarkerClick={(prop) => {
            console.log('Property clicked:', prop.id)
          }}
        />
      </div>
    </div>
  )
}
