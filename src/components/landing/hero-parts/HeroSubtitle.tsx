'use client'

import { useTranslations } from 'next-intl'

export function HeroSubtitle() {
  const t = useTranslations('hero')

  return (
    <p className="text-sm sm:text-base text-white/65 leading-relaxed mb-9 max-w-md lg:max-w-lg">
      {t('subtitle')}
    </p>
  )
}
