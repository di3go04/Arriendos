/**
 * demo.ts — Utilidades para detectar y manejar DEMO_MODE
 *
 * Uso en server components, API routes y server actions:
 *   import { isDemoMode, isIntegrationConfigured } from '@/lib/demo'
 *
 *   if (isDemoMode()) {
 *     return getMockData()
 *   }
 */

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}

export function isIntegrationConfigured(envVar: string): boolean {
  if (isDemoMode()) return false
  return Boolean(process.env[envVar])
}

export function getMockId(prefix = 'demo'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function simulateDelay(ms = 800): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function getDemoCredentials() {
  return {
    email: 'demo@rentnow.app',
    password: 'Demo123!',
  }
}

export const MOCK_DESCRIPTIONS = [
  {
    title: 'Penthouse Ejecutivo con Vista 360°',
    description:
      'Impresionante penthouse de 180m² en el corazón financiero. Terraza privada con piscina infinita, domótica integrada y vista panorámica de la ciudad. 3 habitaciones, 2 baños, estacionamiento para 2 autos.',
    seoMeta:
      'Penthouse ejecutivo en renta | Vista panorámica | Domótica | 180m²',
    hashtags: ['Lujo', 'Penthouse', 'Vista360', 'Domotica'],
  },
  {
    title: 'Loft Industrial en Zona Bohemia',
    description:
      'Loft de 90m² con estilo industrial, ladrillo visto, techos de 5m y balcón interior. Ubicado en el barrio más trendy con cafés, galerías y vida nocturna.',
    seoMeta: 'Loft industrial renta | Zona bohemia | Techos altos | 90m²',
    hashtags: ['Loft', 'Industrial', 'Bohemio', 'Trendy'],
  },
  {
    title: 'Casa Familiar con Jardín y Alberca',
    description:
      'Amplia casa de 250m² en zona residencial, 4 habitaciones, 3 baños, jardín con alberca, asador y área de juegos. Perfecta para familias que buscan espacio y tranquilidad.',
    seoMeta:
      'Casa familiar renta | Jardín | Alberca | 4 habitaciones | Residencial',
    hashtags: ['Casa', 'Familiar', 'Jardin', 'Alberca'],
  },
  {
    title: 'Estudio Amueblado para Joven Profesional',
    description:
      'Estudio de 40m² completamente amueblado en el centro. Ideal para profesionistas solteros. Gimnasio, lavandería y seguridad 24h en el edificio.',
    seoMeta: 'Estudio amueblado renta | Centro | Profesional | 40m²',
    hashtags: ['Estudio', 'Amueblado', 'Centro', 'Profesional'],
  },
  {
    title: 'Local Comercial en Zona Turística',
    description:
      'Local de 60m² en la calle principal, perfecto para retail o restaurante. Alta afluencia peatonal, vitrina amplia, baño privado y bodega.',
    seoMeta: 'Local comercial renta | Zona turística | Retail | 60m²',
    hashtags: ['Local', 'Comercial', 'Turístico', 'Retail'],
  },
]

export function getRandomMockDescription() {
  return MOCK_DESCRIPTIONS[
    Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)
  ]
}
