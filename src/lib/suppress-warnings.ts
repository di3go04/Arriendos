'use client'
import { useEffect } from 'react'

const FILTERED = [/preload.*not used within a few seconds/i]

/**
 * Suprime warnings de CSS preload de Turbopack (solo desarrollo).
 * El warning es inofensivo y no aparece en producción (next build + next start).
 */
export function SuppressWarnings() {
  useEffect(() => {
    const original = console.warn
    console.warn = (...args) => {
      if (FILTERED.some(p => p.test(args.join(' ')))) return
      original.apply(console, args)
    }
    return () => { console.warn = original }
  }, [])
  return null
}
