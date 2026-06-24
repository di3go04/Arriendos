'use client'

import { useEffect, useRef, useState } from 'react'

export interface MapProperty {
  id: string | number
  title: string
  lat: number
  lng: number
  price: string
  type: string
  imageUrl?: string
}

export interface FocusedCity {
  lat: number
  lng: number
  title: string
  temp: number
  humidity: number
}

interface MapViewProps {
  properties: MapProperty[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (property: MapProperty) => void
  focusedCity?: FocusedCity | null
  className?: string
  height?: number
}

const DEFAULT_CENTER: [number, number] = [4.711, -74.0721]
const DEFAULT_ZOOM = 12

const TYPE_COLOR: Record<string, string> = {
  Apartamento: '#2563EB',
  apartamento: '#2563EB',
  Casa: '#10B981',
  casa: '#10B981',
  Local: '#F59E0B',
  local: '#F59E0B',
  Oficina: '#8B5CF6',
  oficina: '#8B5CF6',
  Terreno: '#EF4444',
  terreno: '#EF4444',
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getSafeImageUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString()
  } catch {
    if (value.startsWith('/')) return value
  }
  return undefined
}

export default function MapView({
  properties,
  center: explicitCenter,
  zoom: explicitZoom,
  onMarkerClick,
  focusedCity,
  className = '',
  height = 400,
}: MapViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const focusedMarkerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  const centerRef = useRef(explicitCenter)

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
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const map = L.map(containerRef.current, {
          center: explicitCenter ?? DEFAULT_CENTER,
          zoom: explicitZoom ?? DEFAULT_ZOOM,
          zoomControl: false,
          attributionControl: false,
          minZoom: 2,
          maxZoom: 18,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)
        mapRef.current = map

        const ro = new ResizeObserver(() => {
          map.invalidateSize({ animate: true })
        })
        if (containerRef.current) ro.observe(containerRef.current)

        cleanupMap = () => { ro.disconnect() }

        requestAnimationFrame(() => {
          if (!cancelled) { map.invalidateSize(); setReady(true) }
        })
      } catch (err) {
        console.error('MapView init error:', err)
      }
    }

    init()
    return () => {
      cancelled = true
      cleanupMap?.()
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !ready) return
    const centerChanged = explicitCenter && (
      centerRef.current?.[0] !== explicitCenter[0] ||
      centerRef.current?.[1] !== explicitCenter[1]
    )
    if (centerChanged) {
      centerRef.current = explicitCenter
      mapRef.current.flyTo(explicitCenter, explicitZoom ?? DEFAULT_ZOOM, { duration: 1 })
    }
  }, [explicitCenter, explicitZoom, ready])

  useEffect(() => {
    if (!mapRef.current || !ready) return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default

      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      if (properties.length === 0) return

      properties.forEach(p => {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return

        const color = TYPE_COLOR[p.type] ?? '#64748B'
        const safeTitle = escapeHtml(p.title)
        const safeType = escapeHtml(p.type)
        const safePrice = escapeHtml(p.price)
        const safeImageUrl = getSafeImageUrl(p.imageUrl)

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${color};
            width:32px;height:32px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid white;
            box-shadow:0 8px 18px rgba(6,14,26,0.35);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);color:white;font-weight:900;font-size:10px;letter-spacing:0;font-family:system-ui,sans-serif;">RN</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -34],
        })

        const imageHtml = safeImageUrl
          ? `<img src="${escapeHtml(safeImageUrl)}" alt="${safeTitle}" style="width:100%;height:110px;border-radius:8px;object-fit:cover;margin-bottom:10px;display:block;" />`
          : `<div style="width:100%;height:110px;border-radius:8px;margin-bottom:10px;background:linear-gradient(135deg,${color}22,${color}44);display:flex;align-items:center;justify-content:center;">
              <span style="color:${color};font-weight:900;font-size:20px;font-family:system-ui,sans-serif;">RN</span>
            </div>`

        const popupHtml = `
          <div style="min-width:200px;font-family:system-ui,sans-serif;padding:4px 0;">
            ${imageHtml}
            <div style="font-weight:700;font-size:14px;color:#1E293B;margin-bottom:6px;">${safeTitle}</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="background:${color}22;color:${color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid ${color}44;">${safeType}</span>
              <span style="font-size:15px;font-weight:800;color:#1E3A5F;">${safePrice}</span>
            </div>
          </div>`

        const marker = L.marker([p.lat, p.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(popupHtml, { maxWidth: 260, className: 'rv-mapview-popup' })

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(p))
        }

        markersRef.current.push(marker)
      })

      if (!explicitCenter) {
        const valid = properties.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        if (valid.length === 1) {
          mapRef.current.flyTo([valid[0].lat, valid[0].lng], 13, { duration: 1.35 })
        } else if (valid.length >= 2) {
          const latlngs: [number, number][] = valid.map(p => [p.lat, p.lng])
          const bounds = L.latLngBounds(latlngs)
          if (bounds.isValid()) {
            mapRef.current.flyToBounds(bounds, {
              duration: 1.35,
              padding: [60, 28],
              maxZoom: 13,
            })
          }
        }
      }
    }

    updateMarkers()
  }, [ready, properties, explicitCenter, onMarkerClick])

  useEffect(() => {
    if (!mapRef.current || !ready) return

    const updateFocused = async () => {
      const Leaflet = (await import('leaflet')).default

      if (focusedMarkerRef.current) {
        focusedMarkerRef.current.remove()
        focusedMarkerRef.current = null
      }

      if (!focusedCity) return

      const icon = Leaflet.divIcon({
        className: '',
        html: `<div style="
          background:#F0B90B;
          width:40px;height:40px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 0 20px rgba(240,185,11,0.6), 0 8px 24px rgba(6,14,26,0.4);
          display:flex;align-items:center;justify-content:center;
          animation:rv-focused-pulse 2s infinite;
        ">
          <span style="transform:rotate(45deg);color:#0F2440;font-weight:900;font-size:12px;">📍</span>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -42],
      })

      const popupHtml = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;padding:4px 0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-weight:700;font-size:15px;color:#1E293B;">${focusedCity.title}</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span style="display:flex;align-items:center;gap:4px;font-size:22px;font-weight:800;color:#F59E0B;">${focusedCity.temp}°C</span>
            <span style="display:flex;align-items:center;gap:4px;font-size:13px;color:#64748B;">💧 ${focusedCity.humidity}% HR</span>
          </div>
        </div>`

      const marker = Leaflet.marker([focusedCity.lat, focusedCity.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(popupHtml, { maxWidth: 240, className: 'rv-mapview-popup' })

      marker.openPopup()
      focusedMarkerRef.current = marker
    }

    updateFocused()
  }, [ready, focusedCity])

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative', width: '100%', height, borderRadius: 12, overflow: 'hidden' }}>
      <style>{`
        .rv-mapview-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(15,23,42,0.18) !important;
          border: 1px solid #E2E8F0 !important;
          overflow: hidden !important;
          padding: 0 !important;
        }
        .rv-mapview-popup .leaflet-popup-content {
          margin: 12px 14px !important;
        }
        .rv-mapview-popup .leaflet-popup-tip {
          box-shadow: none !important;
        }
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
        @keyframes rv-focused-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(240,185,11,0.6), 0 8px 24px rgba(6,14,26,0.4); }
          50% { box-shadow: 0 0 32px rgba(240,185,11,0.9), 0 8px 24px rgba(6,14,26,0.4); }
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0F2440',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.68)' }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.16)', borderTopColor: '#F0B90B',
              animation: 'rv-map-spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 14 }}>Cargando mapa...</span>
          </div>
        </div>
      )}
      <style>{`@keyframes rv-map-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
