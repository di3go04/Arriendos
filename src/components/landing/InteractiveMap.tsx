'use client'

import dynamic from 'next/dynamic'
import { Navigation2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Leaflet usa window/document — nunca puede correr en el servidor (SSR)
// dynamic con ssr:false garantiza que el módulo solo se carga en el cliente
const MapComponent = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F1F5F9',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B' }}>
        <Navigation2 style={{ width: 20, height: 20 }} />
        <span style={{ fontSize: 14 }}>Cargando mapa...</span>
      </div>
    </div>
  ),
})

export function InteractiveMap() {
  const t = useTranslations('map')

  return (
    <section className="py-24 bg-muted" id="mapa">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">{t('title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/*
         * CONTENEDOR PADRE DEL MAPA
         *
         * Reglas críticas:
         * - position: relative  → ancla los elementos absolute del hijo (leyenda, search)
         * - height explícito en px → Leaflet NECESITA un número real, no "auto"
         * - overflow: hidden    → evita que el canvas SVG de Leaflet sobresalga del borde
         * - border-radius en el padre, no en el div del mapa
         *
         * Sin height explícito aquí, el div tendrá 0px de alto,
         * Leaflet renderizará tiles en posiciones incorrectas y
         * los labels flotan fuera del contenedor.
         */}
        <div
          style={{
            position: 'relative',
            height: 540,
            width: '100%',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/*
           * MapComponent llena el 100% del padre.
           * Necesita position:absolute y inset:0 para que
           * el dynamic loading overlay también lo cubra correctamente.
           */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <MapComponent />
          </div>
        </div>
      </div>
    </section>
  )
}
