'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapPin, Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react'
import {
  DEMO_PROPERTIES,
  filterMapProperties,
  formatVisiblePropertyCount,
} from '@/lib/map/demo-properties'
import { filterPropertiesInBounds } from '@/lib/map/bounds-filter'
import {
  flyToProperties,
  MAP_FLY_OPTIONS,
  MAP_TILE_URL,
  SEARCH_ZOOM,
  whenMapSized,
} from '@/lib/map/map-view'

// ── Países soportados ──────────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'co', name: 'Colombia',   flag: '🇨🇴', center: [4.711,   -74.0721] as [number, number], zoom: 6 },
  { code: 'mx', name: 'México',     flag: '🇲🇽', center: [19.4326, -99.1332] as [number, number], zoom: 5 },
  { code: 'ar', name: 'Argentina',  flag: '🇦🇷', center: [-34.603, -58.3816] as [number, number], zoom: 5 },
  { code: 'es', name: 'España',     flag: '🇪🇸', center: [40.416,  -3.7033]  as [number, number], zoom: 6 },
  { code: 've', name: 'Venezuela',  flag: '🇻🇪', center: [10.480,  -66.903]  as [number, number], zoom: 6 },
  { code: 'pe', name: 'Perú',       flag: '🇵🇪', center: [-12.046, -77.042]  as [number, number], zoom: 6 },
  { code: 'cl', name: 'Chile',      flag: '🇨🇱', center: [-33.459, -70.645]  as [number, number], zoom: 5 },
  { code: 'us', name: 'EE.UU.',     flag: '🇺🇸', center: [37.090, -95.712]   as [number, number], zoom: 4 },
  { code: '',   name: 'Todo el mundo', flag: '🌍', center: [20, 0]            as [number, number], zoom: 2 },
]

const TYPE_COLOR: Record<string, string> = {
  Apartamento: '#2563EB',
  Casa:        '#10B981',
  Local:       '#F59E0B',
  Oficina:     '#8B5CF6',
  Terreno:     '#EF4444',
}

const TYPES = ['Todos', 'Apartamento', 'Casa', 'Local', 'Oficina']

// ── Styles helpers ──────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.97)',
  backdropFilter: 'blur(8px)',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}

export default function MapInner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<any[]>([])
  const filteredRef  = useRef(DEMO_PROPERTIES)
  const filterKeyRef = useRef<string | null>(null)

  const [query,         setQuery]         = useState('')
  const [searching,     setSearching]     = useState(false)
  const [searchMsg,     setSearchMsg]     = useState<string | null>(null)
  const [ready,         setReady]         = useState(false)
  const [visibleCount,  setVisibleCount]  = useState(0)
  const [country,       setCountry]       = useState(COUNTRIES[0])
  const [countryOpen,   setCountryOpen]   = useState(false)
  const [filtersOpen,   setFiltersOpen]   = useState(false)
  const [typeFilter,    setTypeFilter]    = useState('Todos')

  // Fuente única de verdad: mismo array para marcadores y contador
  const filteredProperties = useMemo(
    () => filterMapProperties(DEMO_PROPERTIES, country.code, typeFilter),
    [country.code, typeFilter],
  )
  useEffect(() => { filteredRef.current = filteredProperties }, [filteredProperties])

  const filterKey = `${country.code}|${typeFilter}`
  const propertyCountLabel = useMemo(
    () => formatVisiblePropertyCount(visibleCount, filteredProperties.length),
    [visibleCount, filteredProperties.length],
  )

  const syncVisibleCount = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const { x, y } = map.getSize()
    if (!x || !y) return
    try {
      const visible = filterPropertiesInBounds(filteredRef.current, map.getBounds())
      setVisibleCount(visible.length)
    } catch {
      // El mapa aún no tiene bounds válidos
    }
  }, [])

  // ── Init mapa ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    let cleanupMap: (() => void) | undefined

    const init = async () => {
      try {
        const L = (await import('leaflet')).default
        if (cancelled || !containerRef.current) return

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const map = L.map(containerRef.current, {
          center:           COUNTRIES[0].center,
          zoom:             COUNTRIES[0].zoom,
          zoomControl:      false,
          attributionControl: false,
          minZoom:          2,
          maxZoom:          18,
          zoomSnap:         0.5,
          zoomDelta:        0.5,
          wheelPxPerZoomLevel: 100,
        })

        L.tileLayer(MAP_TILE_URL, {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)
        mapRef.current = map

        map.on('moveend zoomend', syncVisibleCount)

        const ro = new ResizeObserver(() => {
          map.invalidateSize({ animate: true })
          syncVisibleCount()
        })
        if (containerRef.current) ro.observe(containerRef.current)

        cleanupMap = () => {
          ro.disconnect()
          map.off('moveend zoomend', syncVisibleCount)
        }

        requestAnimationFrame(() => {
          if (!cancelled) { map.invalidateSize(); setReady(true) }
        })
      } catch (err) {
        console.error('Map init error:', err)
      }
    }

    init()
    return () => {
      cancelled = true
      cleanupMap?.()
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [syncVisibleCount])

  // ── Actualizar marcadores cuando cambian filtros ───────────────────────────
  useEffect(() => {
    if (!mapRef.current || !ready) return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default

      // Limpiar marcadores anteriores
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      const makeIcon = (color: string) =>
        L.divIcon({
          className: '',
          html: `<div style="
            background:${color};
            width:28px;height:28px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid white;
            box-shadow:0 3px 8px rgba(0,0,0,0.25)
          "></div>`,
          iconSize:   [28, 28],
          iconAnchor: [14, 28],
          popupAnchor:[0, -30],
        })

      filteredProperties.forEach(p => {
        const color = TYPE_COLOR[p.type] ?? '#64748B'
        const marker = L.marker([p.lat, p.lng], { icon: makeIcon(color) })
          .addTo(mapRef.current)
          .bindPopup(`
            <div style="min-width:160px;font-family:system-ui,sans-serif;padding:2px 0">
              <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#1E293B">${p.title}</div>
              <span style="
                background:${color}22;color:${color};
                font-size:10px;font-weight:700;
                padding:2px 7px;border-radius:20px;
                border:1px solid ${color}44
              ">${p.type}</span>
              <div style="margin-top:8px;font-size:14px;font-weight:800;color:#1E3A5F">${p.price}</div>
            </div>
          `, { maxWidth: 220 })
        markersRef.current.push(marker)
      })

      const shouldRefit = filterKeyRef.current !== filterKey
      filterKeyRef.current = filterKey

      if (shouldRefit) {
        if (filteredProperties.length > 0) {
          flyToProperties(mapRef.current, L, filteredProperties)
        } else {
          whenMapSized(mapRef.current, () => {
            mapRef.current.flyTo(country.center, country.zoom, MAP_FLY_OPTIONS)
          })
        }
      } else {
        syncVisibleCount()
      }
    }

    updateMarkers()
  }, [ready, filteredProperties, filterKey, country.center, country.zoom, syncVisibleCount])

  // ── Cambiar país ──────────────────────────────────────────────────────────
  const handleCountryChange = useCallback((c: typeof COUNTRIES[0]) => {
    setCountry(c)
    setCountryOpen(false)
    setSearchMsg(null)
    setQuery('')
  }, [])

  // ── Búsqueda Nominatim ────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q || !mapRef.current) return

    setSearching(true)
    setSearchMsg(null)

    // Construir URL — si hay país seleccionado, restringir al país
    const countryParam = country.code ? `&countrycodes=${country.code}` : ''
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1${countryParam}&accept-language=es`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(url, {
        headers: { 'User-Agent': 'RentNow/1.0 (rentnow.app)' },
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        setSearchMsg(`Error del servidor (${res.status}). Intenta de nuevo.`)
        return
      }

      const data = await res.json()

      if (!data?.length) {
        const scope = country.code ? `en ${country.name}` : 'en el mundo'
        setSearchMsg(`No se encontraron resultados para "${q}" ${scope}.`)
        return
      }

      const { lat, lon, display_name } = data[0]
      const latNum = parseFloat(lat)
      const lonNum = parseFloat(lon)
      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        setSearchMsg('La ubicación devuelta no es válida. Intenta otra búsqueda.')
        return
      }
      whenMapSized(mapRef.current, () => {
        mapRef.current.flyTo([latNum, lonNum], SEARCH_ZOOM, MAP_FLY_OPTIONS)
      })
      // Mostrar mensaje de éxito brevemente
      setSearchMsg(`📍 ${display_name.split(',').slice(0, 2).join(',')}`)
      setTimeout(() => setSearchMsg(null), 4000)

    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setSearchMsg('La búsqueda tardó demasiado. Verifica tu conexión.')
      } else {
        setSearchMsg('No se pudo conectar. Verifica tu internet.')
      }
    } finally {
      setSearching(false)
    }
  }, [query, country])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Toolbar superior ── */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12,
        zIndex: 1000, display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>

        {/* Selector de país */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setCountryOpen(v => !v); setFiltersOpen(false) }}
            style={{
              ...card,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', color: '#1E3A5F',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 16 }}>{country.flag}</span>
            <span>{country.name}</span>
            <ChevronDown style={{
              width: 14, height: 14, color: '#94A3B8',
              transform: countryOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
          </button>

          {countryOpen && (
            <div style={{
              ...card,
              position: 'absolute', top: '100%', left: 0, marginTop: 6,
              minWidth: 180, maxHeight: 300, overflowY: 'auto', zIndex: 2000,
            }}>
              {COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => handleCountryChange(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 14px',
                    background: c.code === country.code ? '#EFF6FF' : 'transparent',
                    border: 'none', cursor: 'pointer', fontSize: 13,
                    color: c.code === country.code ? '#1E3A5F' : '#374151',
                    fontWeight: c.code === country.code ? 700 : 400,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Barra de búsqueda */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 360 }}>
          <MapPin style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)',
            width: 15, height: 15, color: '#94A3B8', pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchMsg(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={`Buscar en ${country.name}…`}
            style={{
              ...card,
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 32, paddingRight: query ? 30 : 12,
              paddingTop: 8, paddingBottom: 8,
              fontSize: 13, outline: 'none', cursor: 'text',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchMsg(null) }}
              style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', padding: 0, display: 'flex',
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Botón buscar */}
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
            opacity: searching || !query.trim() ? 0.55 : 1,
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            whiteSpace: 'nowrap', transition: 'opacity 0.2s',
          }}
        >
          {searching
            ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-flex' }}>⟳</span>
            : <Search style={{ width: 15, height: 15 }} />
          }
          Buscar
        </button>

        {/* Botón filtros */}
        <button
          onClick={() => { setFiltersOpen(v => !v); setCountryOpen(false) }}
          style={{
            ...card,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', fontSize: 13, fontWeight: 600,
            border: filtersOpen ? '1px solid #2563EB' : '1px solid #E2E8F0',
            color: filtersOpen ? '#2563EB' : '#374151',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <SlidersHorizontal style={{ width: 14, height: 14 }} />
          Filtros
          {typeFilter !== 'Todos' && (
            <span style={{
              background: '#2563EB', color: '#fff',
              fontSize: 10, fontWeight: 700,
              padding: '1px 6px', borderRadius: 10,
            }}>1</span>
          )}
        </button>
      </div>

      {/* ── Panel de filtros ── */}
      {filtersOpen && (
        <div style={{
          ...card,
          position: 'absolute', top: 58, right: 12,
          zIndex: 1000, padding: '14px 16px', minWidth: 220,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
            Tipo de propiedad
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: typeFilter === t ? `1px solid ${t === 'Todos' ? '#2563EB' : TYPE_COLOR[t]}` : '1px solid #E2E8F0',
                  background: typeFilter === t ? (t === 'Todos' ? '#EFF6FF' : `${TYPE_COLOR[t]}15`) : '#fff',
                  color: typeFilter === t ? (t === 'Todos' ? '#2563EB' : TYPE_COLOR[t]) : '#64748B',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {typeFilter !== 'Todos' && (
            <button
              onClick={() => setTypeFilter('Todos')}
              style={{
                marginTop: 10, fontSize: 12, color: '#2563EB',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontWeight: 600,
              }}
            >
              ✕ Limpiar filtro
            </button>
          )}
        </div>
      )}

      {/* ── Mensaje de resultado/error búsqueda ── */}
      {searchMsg && (
        <div style={{
          position: 'absolute',
          top: 58, left: 12,
          zIndex: 1000,
          background: searchMsg.startsWith('📍') ? 'rgba(239,246,255,0.97)' : 'rgba(254,226,226,0.97)',
          border: `1px solid ${searchMsg.startsWith('📍') ? '#BFDBFE' : '#FCA5A5'}`,
          color: searchMsg.startsWith('📍') ? '#1E40AF' : '#DC2626',
          fontSize: 12, fontWeight: 500,
          padding: '7px 12px', borderRadius: 8, maxWidth: 340,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {searchMsg}
        </div>
      )}

      {/* ── Leyenda ── */}
      <div style={{
        ...card,
        position: 'absolute', bottom: 36, left: 12,
        zIndex: 1000, padding: '10px 14px', minWidth: 130,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
          Tipo
        </p>
        {Object.entries(TYPE_COLOR).map(([label, color]) => (
          <div
            key={label}
            onClick={() => setTypeFilter(typeFilter === label ? 'Todos' : label)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
              cursor: 'pointer', opacity: typeFilter !== 'Todos' && typeFilter !== label ? 0.35 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#1E293B' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Contador de resultados ── */}
      {ready && (
        <div style={{
          position: 'absolute', bottom: 36, right: 52,
          zIndex: 1000, padding: '8px 14px',
          background: 'rgba(30, 41, 59, 0.82)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 10,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
            {propertyCountLabel}
          </span>
        </div>
      )}

      {/* ── Canvas de Leaflet ── */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* ── Overlay de carga ── */}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F1F5F9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #CBD5E1', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Cargando mapa…</span>
          </div>
        </div>
      )}

      {/* ── Atribución elegante ── */}
      <div style={{
        position: 'absolute', bottom: 8, right: 12, zIndex: 1000,
        fontSize: 10, color: 'rgba(100,116,139,0.5)',
        fontFamily: 'system-ui, sans-serif', pointerEvents: 'none',
        letterSpacing: '0.02em',
      }}>
        Powered by OpenStreetMap
      </div>

      {/* ── Estilos oscuros para zoom + spinner ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .leaflet-control-zoom a {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          background: rgba(30,41,59,0.85) !important;
          color: rgba(255,255,255,0.9) !important;
          border: none !important;
          transition: background 0.15s !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(30,41,59,1) !important;
          color: #fff !important;
        }
        .leaflet-control-zoom a.leaflet-control-zoom-in {
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
        }
        .leaflet-control-zoom a.leaflet-control-zoom-out {
          border-top: 1px solid rgba(255,255,255,0.08) !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18) !important;
          border: 1px solid #E2E8F0 !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
        }
      `}</style>
    </div>
  )
}
