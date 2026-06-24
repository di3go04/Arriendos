'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('page_error')}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {t('page_error_desc')}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
