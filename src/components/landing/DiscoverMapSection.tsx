'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Thermometer, Globe, MapPin, X } from 'lucide-react'
import type { MapProperty } from '@/components/Map/MapView'
import { locations } from '@/data/locationsData'

const MapComponent = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center bg-brand-800 rounded-xl">
      <div className="flex items-center gap-2 text-white/50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-gold-400" />
        <span className="text-sm">Cargando mapa...</span>
      </div>
    </div>
  ),
})

const DEFAULT_CENTER: [number, number] = [4.711, -74.0721]
const DEFAULT_ZOOM = 12

const PROPERTIES_BY_COUNTRY: Record<string, MapProperty[]> = {
  CO: [
    { id: 1, title: 'Penthouse Vista 360°', lat: 4.711, lng: -74.0721, price: '$2.400.000', type: 'Apartamento', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop' },
    { id: 2, title: 'Loft Industrial', lat: 6.2476, lng: -75.5658, price: '$1.200.000', type: 'Apartamento', imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop' },
    { id: 3, title: 'Casa con Jardín', lat: 4.6947, lng: -74.0314, price: '$1.800.000', type: 'Casa', imageUrl: 'https://images.unsplash.com/photo-1506521781262-d4582b1c5e3f?w=400&h=250&fit=crop' },
    { id: 4, title: 'Casa Playa', lat: 10.391, lng: -75.5144, price: '$3.500.000', type: 'Casa', imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop' },
    { id: 5, title: 'Apartamento 7 de Agosto', lat: 7.1254, lng: -73.1198, price: '$950.000', type: 'Apartamento', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop' },
  ],
  US: [
    { id: 10, title: 'Soho Loft', lat: 40.7128, lng: -74.006, price: '$5,200 USD', type: 'Apartamento', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop' },
    { id: 11, title: 'Miami Beach House', lat: 25.7617, lng: -80.1918, price: '$8,900 USD', type: 'Casa', imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop' },
    { id: 12, title: 'Beverly Hills Mansion', lat: 34.0549, lng: -118.2426, price: '$12,000 USD', type: 'Casa', imageUrl: 'https://images.unsplash.com/photo-1506521781262-d4582b1c5e3f?w=400&h=250&fit=crop' },
    { id: 13, title: 'Downtown Houston', lat: 29.7604, lng: -95.3698, price: '$3,800 USD', type: 'Apartamento', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop' },
    { id: 14, title: 'Chicago Lake Tower', lat: 41.8781, lng: -87.6298, price: '$4,500 USD', type: 'Apartamento', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop' },
  ],
}

const COUNTRY_OPTIONS = [
  { code: 'CO', label: '🇨🇴 Colombia' },
  { code: 'US', label: '🇺🇸 Estados Unidos' },
]

export default function DiscoverMapSection() {
  const [selectedCountry, setSelectedCountry] = useState('CO')
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  const filteredLocations = useMemo(
    () => locations.filter(l => l.countryCode === selectedCountry),
    [selectedCountry],
  )

  useEffect(() => {
    setSelectedLocationId(null)
  }, [selectedCountry])

  const selectedLocation = useMemo(
    () => filteredLocations.find(l => l.id === selectedLocationId) ?? null,
    [filteredLocations, selectedLocationId],
  )

  const mapCenter: [number, number] | undefined = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : undefined

  const mapZoom = selectedLocation ? 12 : undefined

  const focusedCity = selectedLocation
    ? {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        title: `${selectedLocation.cityName}, ${selectedLocation.department}`,
        temp: selectedLocation.temperature,
        humidity: selectedLocation.humidity,
      }
    : null

  const properties = PROPERTIES_BY_COUNTRY[selectedCountry] ?? PROPERTIES_BY_COUNTRY.CO

  function getTempColor(temp: number): string {
    if (temp >= 35) return 'text-red-400'
    if (temp >= 30) return 'text-orange-400'
    if (temp >= 25) return 'text-amber-400'
    if (temp >= 20) return 'text-gold-400'
    return 'text-blue-400'
  }

  return (
    <section className="relative overflow-hidden bg-brand-900 py-24 md:py-32" id="descubre-mapa">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(240,185,11,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 20%, rgba(59,130,246,0.04) 0%, transparent 50%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold-400/10 border border-gold-400/20 px-4 py-1.5 text-sm font-medium text-gold-400 mb-4">
            <Globe className="h-4 w-4" />
            Descubre
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Propiedades destacadas
          </h2>
          <p className="mt-3 text-lg text-white/60 max-w-2xl mx-auto">
            Clima en tiempo real para cada zona.
          </p>
        </div>

        {/* ── Controls ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            className="appearance-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 pr-10 text-sm font-medium text-white/80 outline-none cursor-pointer hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {COUNTRY_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.code} className="bg-brand-800 text-white">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="text-xs text-white/30 select-none">
            {filteredLocations.length}{' '}
            {filteredLocations.length === 1 ? 'zona' : 'zonas'}
          </div>

          {selectedLocation && (
            <button
              onClick={() => setSelectedLocationId(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/10 border border-gold-400/20 px-3 py-1.5 text-xs font-medium text-gold-400 hover:bg-gold-400/20 transition-all"
            >
              <X className="h-3 w-3" />
              {selectedLocation.cityName}
            </button>
          )}
        </div>

        {/* ── Map + Panel ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/30">
            <MapComponent
              key={selectedCountry}
              properties={properties}
              center={mapCenter}
              zoom={mapZoom}
              focusedCity={focusedCity}
              height={520}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-4">
              <Thermometer className="h-4 w-4 text-gold-400" />
              Temperatura por zona
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1.5 scrollbar-thin">
              {filteredLocations.map(loc => {
                const active = selectedLocationId === loc.id
                const barPct = Math.min(100, Math.max(8, ((loc.temperature - 5) / 40) * 100))

                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocationId(active ? null : loc.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-300 cursor-pointer ${
                      active
                        ? 'border-amber-400/60 bg-amber-400/[0.07] shadow-[0_0_24px_rgba(251,191,36,0.1)]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1 pr-2">
                        <span
                          className={`block text-sm font-semibold truncate ${
                            active ? 'text-white' : 'text-white/70'
                          }`}
                        >
                          {loc.cityName}
                        </span>
                        <span className="block text-[11px] text-white/35 truncate mt-0.5">
                          <MapPin className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                          {loc.department}, {loc.country}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 text-base font-bold tabular-nums ${getTempColor(loc.temperature)}`}
                      >
                        {loc.temperature}°C
                      </span>
                    </div>

                    <div className="relative h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                          active ? 'opacity-100' : 'opacity-60'
                        }`}
                        style={{
                          width: `${barPct}%`,
                          background:
                            loc.temperature >= 35
                              ? 'linear-gradient(90deg, #f87171, #ef4444)'
                              : loc.temperature >= 30
                                ? 'linear-gradient(90deg, #fb923c, #f97316)'
                                : loc.temperature >= 25
                                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                  : loc.temperature >= 20
                                    ? 'linear-gradient(90deg, #fcd34d, #f0b90b)'
                                    : 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[10px] text-white/30">💧 {loc.humidity}% HR</span>
                      <span className="text-[10px] text-white/20">•</span>
                      <span className="text-[10px] text-white/30 capitalize">{loc.type}</span>
                    </div>
                  </button>
                )
              })}

              {filteredLocations.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-white/30">
                  Sin datos para este país
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
