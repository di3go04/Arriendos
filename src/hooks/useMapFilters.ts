'use client'

import { useMemo, useState } from 'react'
import type { Property } from '@/types'
import type { FiltersState } from '@/components/Map/LocationFilters'

export type { FiltersState }

export interface FlyToTarget {
  center: [number, number]
  zoom: number
}

const EMPTY_FILTERS: FiltersState = { country: '', department: '', city: '' }

// ─── 30 country centers ────────────────────────────────────────────
const COUNTRY_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Colombia':       { lat:  4.5709, lng: -74.2973, zoom: 5 },
  'Estados Unidos': { lat: 37.0902, lng: -95.7129, zoom: 4 },
  'España':         { lat: 40.4637, lng:  -3.7492, zoom: 5 },
  'Argentina':      { lat:-34.6037, lng: -58.3816, zoom: 4 },
  'México':         { lat: 19.4326, lng: -99.1332, zoom: 5 },
  'Francia':        { lat: 46.6034, lng:   1.8883, zoom: 5 },
  'Italia':         { lat: 41.8719, lng:  12.5674, zoom: 5 },
  'Alemania':       { lat: 51.1657, lng:  10.4515, zoom: 5 },
  'Japón':          { lat: 36.2048, lng: 138.2529, zoom: 5 },
  'Brasil':         { lat:-14.235,  lng: -51.9253, zoom: 4 },
  'Canadá':         { lat: 56.1304, lng:-106.3468, zoom: 3 },
  'Australia':      { lat:-25.2744, lng: 133.7751, zoom: 4 },
  'Reino Unido':    { lat: 55.3781, lng:  -3.436,  zoom: 5 },
  'China':          { lat: 35.8617, lng: 104.1954, zoom: 3 },
  'India':          { lat: 20.5937, lng:  78.9629, zoom: 4 },
  'Rusia':          { lat: 61.524,  lng: 105.3188, zoom: 3 },
  'Chile':          { lat:-35.6751, lng: -71.543,  zoom: 4 },
  'Perú':           { lat: -9.19,   lng: -75.0152, zoom: 5 },
  'Venezuela':      { lat:  6.4238, lng: -66.5897, zoom: 5 },
  'Portugal':       { lat: 39.3999, lng:  -8.2245, zoom: 6 },
  'Países Bajos':   { lat: 52.1326, lng:   5.2913, zoom: 7 },
  'Suecia':         { lat: 60.1282, lng:  18.6435, zoom: 4 },
  'Noruega':        { lat: 60.472,  lng:   8.4689, zoom: 4 },
  'Suiza':          { lat: 46.8182, lng:   8.2275, zoom: 7 },
  'Polonia':        { lat: 51.9194, lng:  19.1451, zoom: 5 },
  'Turquía':        { lat: 38.9637, lng:  35.2433, zoom: 5 },
  'Corea del Sur':  { lat: 35.9078, lng: 127.7669, zoom: 7 },
  'Sudáfrica':      { lat:-30.5595, lng:  22.9375, zoom: 5 },
  'Egipto':         { lat: 26.8206, lng:  30.8025, zoom: 6 },
  'Ecuador':        { lat: -1.8312, lng: -78.1834, zoom: 7 },
}

// ─── Department centers (compound key: "Country::Department") ──────
const DEPARTMENT_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Colombia::Andina':          { lat:  5.5,   lng: -75.2,  zoom: 8 },
  'Colombia::Caribe':          { lat:  6.2,   lng: -72.8,  zoom: 8 },
  'Estados Unidos::Pacífico':  { lat: 35.5,   lng:-115.5,  zoom: 6 },
  'Estados Unidos::Atlántico': { lat: 40.5,   lng: -75.5,  zoom: 6 },
  'España::Central':           { lat: 40.5,   lng:  -3.5,  zoom: 8 },
  'España::Mediterráneo':      { lat: 39.5,   lng:   1.5,  zoom: 8 },
  'Argentina::Pampeana':       { lat:-35.5,   lng: -62.5,  zoom: 7 },
  'Argentina::Patagónica':     { lat:-45.5,   lng: -68.5,  zoom: 6 },
  'México::Norteña':           { lat: 28.5,   lng:-106.5,  zoom: 7 },
  'México::Sureña':            { lat: 18.5,   lng: -97.5,  zoom: 7 },
  'Francia::Alpes':            { lat: 45.5,   lng:   5.5,  zoom: 8 },
  'Francia::Costa Azul':       { lat: 43.5,   lng:   6.5,  zoom: 8 },
  'Italia::Abruzzo':           { lat: 42.5,   lng:  13.5,  zoom: 8 },
  'Italia::Lombardía':         { lat: 45.5,   lng:   9.5,  zoom: 8 },
  'Alemania::Baviera':         { lat: 48.5,   lng:  11.5,  zoom: 8 },
  'Alemania::Renania':         { lat: 51.5,   lng:   7.5,  zoom: 8 },
  'Japón::Kanto':              { lat: 35.5,   lng: 139.5,  zoom: 8 },
  'Japón::Kansai':             { lat: 34.5,   lng: 135.5,  zoom: 8 },
  'Brasil::Nordeste':          { lat:-12.5,   lng: -42.5,  zoom: 6 },
  'Brasil::Sudeste':           { lat:-22.5,   lng: -45.5,  zoom: 6 },
  'Canadá::Columbia':          { lat: 53.5,   lng:-122.5,  zoom: 6 },
  'Canadá::Ontario':           { lat: 48.5,   lng: -82.5,  zoom: 6 },
  'Australia::Queensland':     { lat:-22.5,   lng: 144.5,  zoom: 6 },
  'Australia::Victoria':       { lat:-36.5,   lng: 145.5,  zoom: 7 },
  'Reino Unido::Inglaterra':   { lat: 52.5,   lng:  -1.5,  zoom: 7 },
  'Reino Unido::Escocia':      { lat: 56.5,   lng:  -4.5,  zoom: 7 },
  'China::Oriental':           { lat: 32.5,   lng: 118.5,  zoom: 5 },
  'China::Meridional':         { lat: 25.5,   lng: 108.5,  zoom: 5 },
  'India::Himalaya':           { lat: 28.5,   lng:  80.5,  zoom: 6 },
  'India::Bengala':            { lat: 22.5,   lng:  88.5,  zoom: 7 },
  'Rusia::Siberia':            { lat: 62.5,   lng: 100.5,  zoom: 4 },
  'Rusia::Urales':             { lat: 55.5,   lng:  60.5,  zoom: 5 },
  'Chile::Norte':              { lat:-22.5,   lng: -69.5,  zoom: 6 },
  'Chile::Central':            { lat:-38.5,   lng: -72.5,  zoom: 7 },
  'Perú::Andina':              { lat:-10.5,   lng: -75.5,  zoom: 7 },
  'Perú::Amazonía':            { lat: -5.5,   lng: -74.5,  zoom: 7 },
  'Venezuela::Llanos':         { lat:  8.5,   lng: -67.5,  zoom: 7 },
  'Venezuela::Costera':        { lat: 10.5,   lng: -66.5,  zoom: 7 },
  'Portugal::Norte':           { lat: 41.5,   lng:  -7.5,  zoom: 8 },
  'Portugal::Lisboa':          { lat: 38.5,   lng:  -9.5,  zoom: 9 },
  'Países Bajos::Holanda':     { lat: 52.2,   lng:   4.8,  zoom: 9 },
  'Países Bajos::Frisia':      { lat: 53.0,   lng:   5.5,  zoom: 9 },
  'Suecia::Gotland':           { lat: 58.5,   lng:  15.5,  zoom: 6 },
  'Suecia::Svealand':          { lat: 62.5,   lng:  17.5,  zoom: 6 },
  'Noruega::Østlandet':        { lat: 60.5,   lng:  10.5,  zoom: 7 },
  'Noruega::Vestlandet':       { lat: 62.5,   lng:   6.5,  zoom: 7 },
  'Suiza::Romandía':           { lat: 46.2,   lng:   6.8,  zoom: 9 },
  'Suiza::Zúrich':             { lat: 47.3,   lng:   8.5,  zoom: 9 },
  'Polonia::Masovia':          { lat: 52.5,   lng:  21.5,  zoom: 8 },
  'Polonia::Cracovia':         { lat: 50.5,   lng:  19.5,  zoom: 8 },
  'Turquía::Anatolia':         { lat: 38.5,   lng:  33.5,  zoom: 6 },
  'Turquía::Tracia':           { lat: 41.5,   lng:  27.5,  zoom: 8 },
  'Corea del Sur::Seúl':       { lat: 37.5,   lng: 127.5,  zoom: 9 },
  'Corea del Sur::Jeolla':     { lat: 35.5,   lng: 127.0,  zoom: 8 },
  'Sudáfrica::Cabo':           { lat:-32.5,   lng:  22.5,  zoom: 7 },
  'Sudáfrica::Natal':          { lat:-28.5,   lng:  30.5,  zoom: 7 },
  'Egipto::Delta':             { lat: 30.5,   lng:  31.5,  zoom: 8 },
  'Egipto::Valle':             { lat: 26.5,   lng:  33.5,  zoom: 7 },
  'Ecuador::Costa':            { lat: -1.5,   lng: -79.5,  zoom: 8 },
  'Ecuador::Sierra':           { lat: -1.5,   lng: -78.5,  zoom: 8 },
}

function isValidProperty(p: unknown): p is Property {
  if (!p || typeof p !== 'object') return false
  return true
}

export function useMapFilters(
  locationsData: Property[] = [],
  initialFilters: FiltersState = EMPTY_FILTERS,
) {
  const [filters, setFilters] = useState<FiltersState>(initialFilters)

  const sanitized = useMemo(() => {
    if (!Array.isArray(locationsData)) return []
    return locationsData.filter(isValidProperty)
  }, [locationsData])

  const filteredLocations = useMemo(() => {
    let result = sanitized

    if (filters.city) {
      const cityLower = filters.city.toLowerCase()
      result = result.filter((p) => p?.city?.toLowerCase() === cityLower)
    } else if (filters.department) {
      const deptLower = filters.department.toLowerCase()
      result = result.filter((p: any) => p?.state?.toLowerCase() === deptLower)
    } else if (filters.country) {
      const countryLower = filters.country.toLowerCase()
      result = result.filter((p: any) => p?.country?.toLowerCase() === countryLower)
    }

    return result
  }, [sanitized, filters])

  const flyToTarget = useMemo((): FlyToTarget | null => {
    if (filters.city) {
      const first = filteredLocations[0]
      if (first?.lat && first?.lng) {
        return { center: [first.lat, first.lng], zoom: 13 }
      }
    }

    if (filters.department) {
      const key = `${filters.country}::${filters.department}`
      const center = (DEPARTMENT_CENTERS as any)[key]
      if (center) return { center: [center.lat, center.lng], zoom: center.zoom }
    }

    if (filters.country) {
      const center = COUNTRY_CENTERS[filters.country]
      if (center) return { center: [center.lat, center.lng], zoom: center.zoom }
    }

    return null
  }, [filters, filteredLocations])

  return {
    filteredLocations,
    filters,
    setFilters,
    flyToTarget,
    isLoading: false,
    isError: false,
  }
}
