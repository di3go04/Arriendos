'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface RawLocation {
  country: string
  department: string
  city: string
  lat: number
  lng: number
}

const FALLBACK_LOCATIONS: RawLocation[] = [
  { country: 'Colombia',       department: 'Andina',     city: 'Medellín',        lat: 6.2476,  lng: -75.5658 },
  { country: 'Colombia',       department: 'Andina',     city: 'Bogotá',          lat: 4.711,   lng: -74.0721 },
  { country: 'Colombia',       department: 'Caribe',     city: 'Cartagena',       lat: 10.391,  lng: -75.5144 },
  { country: 'Estados Unidos', department: 'Pacífico',   city: 'Los Angeles',     lat: 34.0522, lng: -118.2437 },
  { country: 'Estados Unidos', department: 'Pacífico',   city: 'San Francisco',   lat: 37.7749, lng: -122.4194 },
  { country: 'Estados Unidos', department: 'Atlántico',  city: 'Miami',           lat: 25.7617, lng: -80.1918 },
  { country: 'España',         department: 'Central',    city: 'Madrid',          lat: 40.4168, lng: -3.7038 },
  { country: 'España',         department: 'Mediterráneo', city: 'Barcelona',     lat: 41.3874, lng: 2.1686 },
  { country: 'España',         department: 'Mediterráneo', city: 'Valencia',      lat: 39.4699, lng: -0.3763 },
  { country: 'Argentina',      department: 'Pampeana',   city: 'Buenos Aires',    lat: -34.6037,lng: -58.3816 },
  { country: 'Argentina',      department: 'Patagónica', city: 'Bariloche',       lat: -41.1335,lng: -71.3103 },
  { country: 'Argentina',      department: 'Patagónica', city: 'Ushuaia',         lat: -54.8019,lng: -68.303 },
  { country: 'México',         department: 'Norteña',    city: 'Ciudad de México',lat: 19.4326, lng: -99.1332 },
  { country: 'México',         department: 'Sureña',     city: 'Cancún',          lat: 21.1619, lng: -86.8515 },
  { country: 'México',         department: 'Sureña',     city: 'Tulum',           lat: 20.211,  lng: -87.4654 },
]

export function useLocations() {
  const [locations, setLocations] = useState<RawLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('country, department, city, lat, lng')

        if (cancelled) return

        if (error) {
          // Log the error but use fallback (table may not exist yet)
          if (error.code === 'PGRST116' || error.code === '42P01') {
            // 404-like codes: relation does not exist or no rows
            console.warn('[useLocations] Table not found or empty, using fallback:', error.message)
          } else {
            console.warn('[useLocations] Supabase error, using fallback:', error.message)
          }
          setLocations(FALLBACK_LOCATIONS)
          setIsError(true)
          setIsLoading(false)
          return
        }

        if (data && data.length > 0) {
          setLocations(data as RawLocation[])
          setIsError(false)
        } else {
          setLocations(FALLBACK_LOCATIONS)
          setIsError(true)
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[useLocations] Network or parse error, using fallback:', err)
          setLocations(FALLBACK_LOCATIONS)
          setIsError(true)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchLocations()
    return () => { cancelled = true }
  }, [])

  return { locations, isLoading, isError }
}
