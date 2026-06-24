import type { MapProperty } from './demo-properties'

type LatLngBoundsLike = {
  contains(latlng: [number, number] | { lat: number; lng: number }): boolean
}

/** Propiedades cuyas coordenadas caen dentro del viewport actual del mapa. */
export function filterPropertiesInBounds(
  properties: MapProperty[],
  bounds: LatLngBoundsLike,
): MapProperty[] {
  return properties.filter(p => bounds.contains([p.lat, p.lng]))
}
