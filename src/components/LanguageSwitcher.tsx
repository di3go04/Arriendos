'use client';

import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { locales } from '@/i18n/config';

interface Props {
  currentLocale?: string;
}

const labelMap: Record<string, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
};

const flagFile: Record<string, string> = {
  es: '/flags/es.svg',
  en: '/flags/gb.svg',
  fr: '/flags/fr.svg',
  de: '/flags/de.svg',
  pt: '/flags/pt.svg',
  it: '/flags/it.svg',
};

export default function LanguageSwitcher({ currentLocale }: Props) {
  const pathname = usePathname();
  const nextIntlLocale = useLocale();
  const activeLocale = currentLocale || nextIntlLocale || 'es';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const languageLinks = useMemo(() => locales.map((loc) => {
    const segments = pathname.split('/');
    const firstSegment = segments[1];
    const hasLocale = locales.includes(firstSegment as typeof locales[number]);

    if (hasLocale) {
      const newSegments = [...segments];
      newSegments[1] = loc;
      return { loc, href: newSegments.join('/') || `/${loc}` };
    }

    return { loc, href: `/${loc}${pathname === '/' ? '' : pathname}` };
  }), [pathname]);

  const activeLabel = labelMap[activeLocale] || activeLocale.toUpperCase();

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm font-semibold text-brand-800 shadow-sm transition-all duration-300 hover:border-brand-200 hover:bg-brand-50 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Select language"
      >
        <Globe2 className="h-4 w-4 text-text-muted" />
        <img
          src={flagFile[activeLocale] || '/flags/es.svg'}
          alt={activeLabel}
          className="w-5 h-3.5 object-cover rounded-sm"
        />
        <span className="hidden sm:inline">{activeLabel}</span>
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border-subtle bg-white py-1 shadow-elevated animate-scale-in origin-top-right"
        >
          {languageLinks.map(({ loc, href }) => {
            const active = loc === activeLocale;
            return (
              <a
                key={loc}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  document.cookie = `RentNow_locale=${loc}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
                  window.location.href = href;
                }}
                title={labelMap[loc]}
                role="menuitem"
                className={`flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 ${
                  active
                    ? 'bg-brand-50 font-bold text-brand-900'
                    : 'text-brand-700 hover:bg-surface hover:text-brand-900'
                }`}
              >
                <img
                  src={flagFile[loc] || '/flags/es.svg'}
                  alt={labelMap[loc]}
                  className="w-5 h-3.5 object-cover rounded-sm"
                />
                <span className="flex-1">{labelMap[loc]}</span>
                {active && <Check className="h-4 w-4 text-amber-500" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
