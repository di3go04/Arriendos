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
        className="inline-flex items-center gap-2 rounded-xl border border-[#e6edf5] bg-white px-3 py-2 text-sm font-semibold text-[#1e293b] shadow-sm transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Select language"
      >
        <Globe2 className="h-4 w-4 text-[#64748b]" />
        <img
          src={flagFile[activeLocale] || '/flags/es.svg'}
          alt={activeLabel}
          className="w-5 h-3.5 object-cover rounded-sm"
        />
        <span className="hidden sm:inline">{activeLabel}</span>
        <ChevronDown className={`h-4 w-4 text-[#64748b] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[#e6edf5] bg-white py-1 shadow-xl"
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
                className={`flex items-center gap-3 px-3 py-2 text-sm transition ${
                  active ? 'bg-[#e6edf5] font-bold text-[#1e3a5f]' : 'text-[#475569] hover:bg-[#f8fafc]'
                }`}
              >
                <img
                  src={flagFile[loc] || '/flags/es.svg'}
                  alt={labelMap[loc]}
                  className="w-5 h-3.5 object-cover rounded-sm"
                />
                <span className="flex-1">{labelMap[loc]}</span>
                {active && <Check className="h-4 w-4" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
