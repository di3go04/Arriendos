'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Property } from '@/types'
import { useAuth } from '@/context/AuthContext'
import MapView from '@/components/Map/MapView'
import { LocationFilters } from '@/components/Map/LocationFilters'
import { useMapFilters } from '@/hooks/useMapFilters'
import type { MapProperty } from '@/components/Map/MapView'
import { Search, SlidersHorizontal, Loader2, MapPin } from 'lucide-react'

const TYPE_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'casa', label: 'Casas' },
  { value: 'apartamento', label: 'Apartamentos' },
  { value: 'local', label: 'Locales' },
  { value: 'oficina', label: 'Oficinas' },
  { value: 'terreno', label: 'Terrenos' },
]

function propertyToMapMarker(p: Property | undefined | null): MapProperty | null {
  if (!p) return null
  return {
    id: p.id,
    title: p.title,
    lat: p.lat ?? 4.711,
    lng: p.lng ?? -74.0721,
    price: `$${p.monthly_rent?.toLocaleString('es-CO')}`,
    type: p.type === 'apartamento' ? 'Apartamento'
      : p.type === 'casa' ? 'Casa'
      : p.type === 'local' ? 'Local'
      : p.type === 'oficina' ? 'Oficina'
      : 'Terreno',
    imageUrl: p.image_urls?.[0],
  }
}

export function DashboardMap() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let attempts = 0

    const fetchWithCoords = async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }

    const fetchWithoutCoords = async (): Promise<Property[]> => {
      const { data } = await supabase
        .from('properties')
        .select('id, owner_id, title, type, address, city, area_sqm, bedrooms, bathrooms, description, amenities, monthly_rent, deposit, available_from, status, image_urls, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      return (data || []).map((p: any) => ({
        ...p,
        lat: 4.711 + (Math.random() - 0.5) * 0.02,
        lng: -74.0721 + (Math.random() - 0.5) * 0.02,
      }))
    }

    const fetchProperties = async () => {
      attempts++
      try {
        const data = await fetchWithCoords()
        if (!cancelled) setProperties(data)
      } catch (err: any) {
        const isSchemaError = err?.code === '42703' || err?.message?.includes('does not exist')
        if (isSchemaError && attempts <= 1) {
          try {
            const data = await fetchWithoutCoords()
            if (!cancelled) setProperties(data)
          } catch {
            if (!cancelled) setProperties([])
          }
        } else {
          if (!cancelled) setProperties([])
        }
      }
      if (!cancelled) setLoading(false)
    }

    fetchProperties()
    return () => { cancelled = true }
  }, [user])

  const { filteredLocations, filters, setFilters, flyToTarget } = useMapFilters(properties)

  const filtered = useMemo(() => {
    let result = filteredLocations || []
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        !!p && (
          p.title?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
        ),
      )
    }
    if (typeFilter) {
      result = result.filter(p => !!p && p.type === typeFilter)
    }
    return result
  }, [filteredLocations, searchQuery, typeFilter])

  const markers: MapProperty[] = useMemo(() => {
    return (filtered || [])
      .map(propertyToMapMarker)
      .filter((m): m is MapProperty => m !== null)
  }, [filtered])

  const center = useMemo(() => {
    if (flyToTarget) return flyToTarget.center
    const withCoords = (properties || []).filter(p => !!p && p.lat != null && p.lng != null)
    if (withCoords.length === 0) return [4.711, -74.0721] as [number, number]
    const avgLat = withCoords.reduce((s, p) => s + (p.lat ?? 0), 0) / withCoords.length
    const avgLng = withCoords.reduce((s, p) => s + (p.lng ?? 0), 0) / withCoords.length
    return [avgLat, avgLng] as [number, number]
  }, [properties, flyToTarget])

  const zoom = useMemo(() => {
    return flyToTarget?.zoom ?? 10
  }, [flyToTarget])

  const handleClearFilters = useCallback(() => {
    setFilters({ country: '', department: '', city: '' })
    setSearchQuery('')
    setTypeFilter('')
  }, [setFilters])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-xl border bg-card text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          Aún no has registrado propiedades en este mapa.
        </p>
        <p className="text-xs text-muted-foreground/60">
          ¡Publica tu primera propiedad!
        </p>
      </div>
    )
  }

  const hasLocationFilter = filters.country || filters.department || filters.city

  return (
    <div className="space-y-4">
      {/* Location Filters (cascading) */}
      <LocationFilters filters={filters} onChange={setFilters} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título, ciudad..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
            showFilters || typeFilter ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {typeFilter && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">1</span>}
        </button>
        <div className="text-xs text-muted-foreground">
          {markers.length} de {properties.length} propiedades
        </div>
        {(hasLocationFilter || searchQuery || typeFilter) && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                typeFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <MapView
          properties={markers}
          center={center}
          zoom={zoom}
          height={480}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.slice(0, 8).map(p => (
          <div
            key={p?.id ?? Math.random()}
            className="flex items-center gap-2 rounded-lg border bg-card p-2"
          >
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${
                p?.status === 'disponible' ? 'bg-green-500'
                : p?.status === 'ocupado' ? 'bg-blue-500'
                : p?.status === 'mantenimiento' ? 'bg-yellow-500'
                : 'bg-zinc-500'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{p?.title ?? '—'}</p>
              <p className="truncate text-[10px] text-muted-foreground">{p?.city ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
