'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardTemplatesRedirect() {
  const t = useTranslations('TEMPLATES_PAGE');
  const router = useRouter();

  useEffect(() => {
    router.replace('/templates');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-xs font-semibold text-muted-foreground">{t('redirecting')}</p>
    </div>
  );
}
