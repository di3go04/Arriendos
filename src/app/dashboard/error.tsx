'use client'

import { useTranslations } from 'next-intl';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">{t('dashboard_error')}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t('dashboard_error_desc')}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          {t('retry')}
        </button>
      </div>
    </div>
  )
}
