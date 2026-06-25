import type { MapProperty } from './demo-properties'

/** Tiles permitidos por el CSP del proyecto */
export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export const MAP_FIT_PADDING: [number, number] = [80, 28]

export const MAP_FLY_OPTIONS = {
  duration: 1.35,
  easeLinearity: 0.22,
} as const

export const SEARCH_ZOOM = 14
export const SINGLE_MARKER_ZOOM = 13

type LeafletMap = {
  flyTo(latlng: [number, number], zoom: number, options?: object): void
  flyToBounds(bounds: unknown, options?: object): void
  invalidateSize(): void
  getSize(): { x: number; y: number }
  whenReady(cb: () => void): void
}

type LeafletNS = {
  latLngBounds(latlngs: [number, number][]): { isValid(): boolean }
}

function validCoords(properties: MapProperty[]): [number, number][] {
  return properties
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map(p => [p.lat, p.lng] as [number, number])
}

/** Espera a que el contenedor del mapa tenga tamaño real (evita NaN en flyToBounds). */
export function whenMapSized(map: LeafletMap, fn: () => void): void {
  map.whenReady(() => {
    map.invalidateSize()

    const attempt = (tries: number) => {
      const { x, y } = map.getSize()
      if (x > 0 && y > 0) {
        fn()
        return
      }
      if (tries < 12) {
        requestAnimationFrame(() => attempt(tries + 1))
      }
    }

    attempt(0)
  })
}

/** Encuadra el mapa para mostrar todas las propiedades filtradas con padding y zoom inteligente. */
export function flyToProperties(
  map: LeafletMap,
  L: LeafletNS,
  properties: MapProperty[],
): void {
  if (!map || properties.length === 0) return

  whenMapSized(map, () => {
    if (properties.length === 1) {
      const p = properties[0]
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return
      map.flyTo([p.lat, p.lng], SINGLE_MARKER_ZOOM, MAP_FLY_OPTIONS)
      return
    }

    const latlngs = validCoords(properties)
    if (latlngs.length < 2) return

    const bounds = L.latLngBounds(latlngs)
    if (!bounds.isValid()) return

    map.flyToBounds(bounds, {
      ...MAP_FLY_OPTIONS,
      padding: MAP_FIT_PADDING,
      maxZoom: maxZoomForSpread(properties),
    })
  })
}

function maxZoomForSpread(properties: MapProperty[]): number {
  if (properties.length <= 1) return SINGLE_MARKER_ZOOM
  const lats = properties.map(p => p.lat)
  const lngs = properties.map(p => p.lng)
  const latSpan = Math.max(...lats) - Math.min(...lats)
  const lngSpan = Math.max(...lngs) - Math.min(...lngs)
  const span = Math.max(latSpan, lngSpan)

  if (span < 0.08) return 13
  if (span < 0.35) return 11
  if (span < 1.5) return 8
  if (span < 8) return 6
  return 4
}
