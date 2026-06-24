'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function HeroBadge() {
  const t = useTranslations('hero')

  return (
    <span className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase
      bg-white/[0.06] border border-gold-400/25 text-gold-300
      backdrop-blur-md shadow-[0_0_20px_rgba(240,185,11,0.12)]">
      <Sparkles className="w-3.5 h-3.5 text-gold-400" aria-hidden="true" />
      {t('badge')}
    </span>
  )
}
