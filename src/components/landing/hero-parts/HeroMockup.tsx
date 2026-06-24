'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'

type StatusKey = 'occupied' | 'available' | 'maintenance'

const STATUS_STYLES: Record<StatusKey, { dot: string; shadow: string }> = {
  occupied: { dot: 'bg-emerald-400', shadow: 'rgba(52,211,153,0.5)' },
  available: { dot: 'bg-amber-400', shadow: 'rgba(240,185,11,0.5)' },
  maintenance: { dot: 'bg-rose-400', shadow: 'rgba(251,113,133,0.5)' },
}

const STATUS_KEY_MAP: Record<StatusKey, string> = {
  occupied: 'prop_1_status',
  available: 'prop_2_status',
  maintenance: 'prop_3_status',
}

const KPI_CONFIG = [
  { key: 'occupancy', color: 'from-emerald-400/30 to-emerald-500/10' },
  { key: 'properties', color: 'from-gold-400/30 to-gold-400/10' },
  { key: 'late_renters', color: 'from-rose-400/30 to-rose-500/10' },
] as const

const PROPERTIES: { statusKey: StatusKey; nameKey: string; rentKey: string }[] = [
  { statusKey: 'occupied', nameKey: 'prop_1_name', rentKey: 'prop_1_rent' },
  { statusKey: 'available', nameKey: 'prop_2_name', rentKey: 'prop_2_rent' },
  { statusKey: 'maintenance', nameKey: 'prop_3_name', rentKey: 'prop_3_rent' },
]

export function HeroMockup() {
  const t = useTranslations('hero')
  const mockupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mockupRef.current
    if (!el) return
    let ticking = false
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!el) return
          const rect = el.getBoundingClientRect()
          const offset = rect.top - window.innerHeight
          if (offset < 0 && rect.bottom > 0) {
            el.style.transform = `perspective(1200px) rotateY(-3deg) rotateX(2deg) translateY(${offset * -0.1}px)`
          }
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={mockupRef}
      className="relative hidden lg:block will-change-transform"
      style={{ transform: 'perspective(1200px) rotateY(-3deg) rotateX(2deg)' }}
    >
      <div
        className="absolute -inset-6 rounded-3xl blur-2xl opacity-60"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(240,185,11,0.18) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <motion.div
        className="absolute -top-3 -right-2 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl
          bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <div className="relative">
          <Bell className="w-4 h-4 text-gold-300" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-brand-900" />
        </div>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400/80" />
        </span>
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full
          bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/40
          shadow-[0_0_24px_rgba(16,185,129,0.25)]"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        aria-hidden="true"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </span>
        <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap">
          {t('mockup.payment_received')}
        </span>
      </motion.div>

      <div
        className="relative rounded-2xl overflow-hidden
          bg-white/[0.07] backdrop-blur-2xl
          border border-white/15
          shadow-[0_0_40px_rgba(240,185,11,0.12),0_30px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <div className="ml-4 flex-1 h-6 rounded-md bg-white/5 flex items-center px-3 border border-white/5">
            <span className="text-[11px] text-white/35">app.rentnow.app</span>
          </div>
        </div>

        <div className="p-6 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400/30 to-amber-600/20 border border-gold-400/40 flex items-center justify-center shadow-[0_0_16px_rgba(240,185,11,0.2)]">
              <Home className="w-5 h-5 text-gold-400" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white/90">{t('mockup.dashboard_title')}</p>
              <p className="text-[11px] text-white/40">{t('mockup.dashboard_subtitle')}</p>
            </div>
            <div className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white/40" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {KPI_CONFIG.map((kpi) => {
              const parts = t(`mockup.stats_${kpi.key}`).split(' ')
              const value = parts[0]
              const label = parts.slice(1).join(' ')
              return (
                <div
                  key={kpi.key}
                  className="rounded-xl py-2.5 px-3 bg-white/[0.05] border border-white/10 backdrop-blur-sm"
                >
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{label}</p>
                  <p className={`text-lg font-black bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`}>
                    {value}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.06]">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{t('mockup.properties_header')}</span>
              <span className="text-[10px] text-gold-400/60">{t('mockup.properties_view_all')}</span>
            </div>
            {PROPERTIES.map((prop, i) => {
              const style = STATUS_STYLES[prop.statusKey]
              const statusKey = STATUS_KEY_MAP[prop.statusKey]
              return (
                <div
                  key={prop.nameKey}
                  className={`flex items-center gap-3 px-3.5 py-2.5 ${i < 2 ? 'border-b border-white/[0.04]' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0 shadow-[0_0_6px_var(--dot-shadow)]`} style={{ '--dot-shadow': style.shadow } as React.CSSProperties} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/85 truncate">{t(`mockup.${prop.nameKey}`)}</p>
                    <p className="text-[10px] text-white/35">{t(`mockup.${prop.rentKey}`)} · {t(`mockup.${statusKey}`)}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-white/20 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )
            })}
          </div>

          <motion.div
            className="relative rounded-xl px-3.5 py-2.5 bg-gradient-to-r from-gold-400/15 to-amber-500/5 border border-gold-400/25 shadow-[0_0_20px_rgba(240,185,11,0.15)]"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gold-400/20 border border-gold-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gold-300 leading-snug">
                  {t('mockup.ai_title')}
                </p>
                <p className="text-[10px] text-white/35 mt-0.5">{t('mockup.ai_subtitle')}</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
