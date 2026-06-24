'use client'

import { Globe, Shield, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const benefitIcons = [Shield, X, Globe] as const

export function HeroBenefits() {
  const t = useTranslations('hero')
  const labels = [
    t('benefits.no_card'),
    t('benefits.cancel_anytime'),
    t('benefits.multi_language'),
  ] as const

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/50">
      {labels.map((label, i) => {
        const Icon = benefitIcons[i]
        return (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon className="w-4 h-4 text-gold-400" aria-hidden="true" />
            {label}
          </span>
        )
      })}
    </div>
  )
}
