'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

interface BackToHomeProps {
  className?: string;
  children?: React.ReactNode;
  href?: string;
}

export default function BackToHome({
  className,
  children,
  href = '/',
}: BackToHomeProps) {
  const locale = useLocale();
  const t = useTranslations();
  const localizedHref = href === '/' ? `/${locale}` : href;
  const label = children || t('actions.back_home');

  return (
    <Link
      href={localizedHref}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold',
        'text-primary hover:text-primary/80 hover:bg-primary/5',
        'border border-transparent hover:border-primary/10 rounded-lg',
        'transition-all duration-150 active:scale-95',
        'select-none',
        className
      )}
      aria-label={String(label)}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}
