'use client'

import { useTranslations } from 'next-intl'

const highlightClass =
  'bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 bg-clip-text text-transparent'

export function HeroTitle() {
  const t = useTranslations('hero')

  return (
    <h1 className="font-black text-white text-[2rem] sm:text-4xl lg:text-[2.65rem] xl:text-5xl leading-[1.12] tracking-tight mb-5 max-w-xl lg:max-w-2xl">
      <span className={highlightClass}>{t('title_highlight1')}</span>
      {' '}
      <span className="text-white">{t('title_middle')}</span>
      {' '}
      <span className={highlightClass}>{t('title_highlight2')}</span>
    </h1>
  )
}
