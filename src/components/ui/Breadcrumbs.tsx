'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  properties: 'Propiedades',
  tenants: 'Inquilinos',
  leases: 'Contratos',
  payments: 'Pagos',
  expenses: 'Gastos',
  maintenance: 'Mantenimiento',
  documents: 'Documentos',
  reports: 'Reportes',
  contracts: 'Contratos',
  subscription: 'Suscripción',
  verification: 'Verificación',
  settings: 'Ajustes',
  'voice-agent': 'Asistente de Voz',
  templates: 'Plantillas',
  leads: 'Prospectos',
  affiliates: 'Afiliados',
  landlord: 'Propietario',
  'real-time': 'Tiempo Real',
  tenant: 'Inquilino',
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {segments.slice(1).map((segment, index) => {
          const href = '/' + segments.slice(0, index + 2).join('/')
          const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
          const isLast = index === segments.length - 2

          return (
            <li key={segment} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">{label}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors truncate max-w-[200px]">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
