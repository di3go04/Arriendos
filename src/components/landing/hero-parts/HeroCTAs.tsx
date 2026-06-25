'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

const primaryBtn =
  'inline-flex items-center gap-2 py-3.5 md:py-4 px-7 md:px-8 text-base font-semibold rounded-pill ' +
  'bg-gold-400 text-brand-900 transition-all duration-300 ' +
  'hover:bg-gold-500 hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(240,185,11,0.45)] ' +
  'active:scale-[0.98]'

const secondaryBtn =
  'inline-flex items-center gap-2 py-3.5 md:py-4 px-7 md:px-8 text-base font-semibold rounded-pill ' +
  'border border-white/30 text-white/90 bg-transparent transition-all duration-300 ' +
  'hover:bg-white/[0.08] hover:border-white/45 hover:scale-[1.02] ' +
  'active:scale-[0.98]'

export function HeroCTAs() {
  const t = useTranslations('hero')

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
      <Link href="/register" className={primaryBtn}>
        {t('ctaStart')}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
      <Link href="/demo" className={secondaryBtn}>
        {t('ctaDemo')}
      </Link>
    </div>
  )
}
