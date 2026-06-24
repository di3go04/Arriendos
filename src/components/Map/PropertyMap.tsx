'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

interface PropertyMapProps {
  lat: number
  lng: number
  title: string
  address?: string | null
  className?: string
  height?: number
}

export function PropertyMap({ lat, lng, title, address, className = '', height = 240 }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

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
          center: [lat, lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map)

        mapRef.current = map

        const ro = new ResizeObserver(() => { map.invalidateSize() })
        if (containerRef.current) ro.observe(containerRef.current)

        requestAnimationFrame(() => {
          if (!cancelled) { map.invalidateSize(); setReady(true) }
        })
      } catch (err) {
        console.error('PropertyMap init error:', err)
      }
    }

    init()
    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [lat, lng])

  useEffect(() => {
    if (!mapRef.current || !ready) return

    const updateMarker = async () => {
      const L = (await import('leaflet')).default
      const color = '#2563EB'

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color};
          width:36px;height:36px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 8px 18px rgba(6,14,26,0.35);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);color:white;font-weight:900;font-size:11px;">RN</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current)
      marker.bindPopup(
        `<div style="min-width:180px;font-family:system-ui,sans-serif;padding:4px 0;">
          <div style="font-weight:700;font-size:13px;color:#1E293B;margin-bottom:4px;">${title}</div>
          ${address ? `<div style="font-size:11px;color:#64748B;">${address}</div>` : ''}
        </div>`,
        { maxWidth: 260 }
      )
    }

    updateMarker()
  }, [ready, lat, lng, title, address])

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-muted ${className}`} style={{ height }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Ubicación no disponible
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
            Cargando mapa...
          </div>
        </div>
      )}
    </div>
  )
}
