'use client'

import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import AppLanguageSwitcher from '@/components/AppLanguageSwitcher'
import {
  LayoutDashboard, Building2, FileText, CreditCard, Shield,
  Settings, ChevronLeft, X, Phone, BarChart3, Users, Zap,
  ArrowLeft, FileSpreadsheet, MapPin, Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const tnav = useTranslations('nav')
  const tside = useTranslations('sidebar')

  const links = [
    { href: '/app', icon: LayoutDashboard, label: tnav('dashboard') },
    { href: '/app/properties', icon: Building2, label: tnav('properties') },
    { href: '/app/contracts', icon: FileText, label: tnav('leases') },
    { href: '/app/payments', icon: CreditCard, label: tnav('payments') },
    { href: '/app/verification', icon: Shield, label: tside('verification') },
    { href: '/app/voice-agent', icon: Phone, label: tside('voice_agent') },
    { href: '/app/documents', icon: FileText, label: tside('documents_ia') },
    { href: '/app/affiliates', icon: BarChart3, label: tside('affiliates') },
    { href: '/app/notifications', icon: Bell, label: tside('notifications') },
    { href: '/app/mapa', icon: MapPin, label: tside('mapa') },
    { href: '/app/reports', icon: FileSpreadsheet, label: tside('reports') },
    { href: '/app/subscription', icon: Zap, label: tside('subscription') },
  ]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const sidebarContent = (
    <div className="flex h-full flex-col bg-background border-r">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Logo href="/app" />
        <button onClick={onClose} className="lg:hidden rounded-lg p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onClose()}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3 space-y-1">
        <Link
          href="/app/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          {tnav('settings')}
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {tside('back_to_landing')}
        </Link>
        <div className="px-1 pt-1">
          <AppLanguageSwitcher />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={onClose}
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 h-full w-72 bg-background"
              onClick={e => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
