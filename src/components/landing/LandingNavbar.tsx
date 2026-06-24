'use client';

import { Logo } from '@/components/Logo';
import LanguageSelector from '@/components/LanguageSelector';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Menu, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const navLinks = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.features', href: '#features' },
  { key: 'nav.pricing', href: '/precios' },
  { key: 'nav.developers', href: '/developers' },
  { key: 'nav.properties', href: '/propiedades' },
] as const;

export function LandingNavbar() {
  const t = useTranslations();
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        const first = menuRef.current?.querySelector<HTMLElement>('a, button');
        first?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    document.body.style.overflow = '';
    prevFocusRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!mobileOpen) return;
      if (e.key === 'Escape') {
        close();
        hamburgerRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, close]);

  function href(path: string) {
    return path.startsWith('/') && !path.startsWith('#')
      ? `/${locale}${path}`
      : path;
  }

  return (
    <nav
      className="relative z-50 border-b border-border-subtle bg-white/80 backdrop-blur-md"
      aria-label={t('nav.home')}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-5 md:px-8 h-16">
        <Logo />

        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-6" role="list">
            {navLinks.map((link) => (
              <li key={link.key}>
                <a
                  href={href(link.href)}
                  className="text-sm font-medium text-text-muted hover:text-brand-900 transition-all duration-300 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>
          <LanguageSelector />
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href={`/${locale}/login`}
            className="relative text-sm font-semibold text-brand-900 hover:text-brand-950 transition-all duration-300 px-4 py-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 after:absolute after:bottom-1 after:left-4 after:right-4 after:h-[2px] after:bg-brand-900 after:scale-x-0 after:origin-center after:transition-transform after:duration-300 hover:after:scale-x-100"
          >
            {t('nav.login')}
          </a>
          <a
            href={`/${locale}/register`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-950 px-5 py-2.5 rounded-xl shadow-[0_2px_4px_rgba(30,58,95,0.15)] hover:shadow-[0_4px_12px_rgba(30,58,95,0.25)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            {t('nav.signup')}
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="md:hidden p-2 rounded-lg text-text-muted hover:text-brand-900 hover:bg-brand-50 transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className="md:hidden absolute inset-x-0 top-16 border-b border-border-subtle bg-white shadow-xl animate-fade-in"
        >
          <div className="px-5 py-4 space-y-1">
            <ul className="space-y-1" role="list">
              {navLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={href(link.href)}
                    onClick={close}
                    className="block px-3 py-2.5 text-sm font-medium text-brand-700 hover:text-brand-900 hover:bg-surface rounded-lg transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="pt-3 pb-1">
              <p className="px-3 text-[11px] font-semibold text-text-subtle uppercase tracking-wider mb-2">
                Idioma
              </p>
              <LanguageSelector />
            </div>

            <hr className="border-border-subtle my-3" />

            <a
              href={`/${locale}/login`}
              onClick={close}
              className="block w-full text-center px-3 py-2.5 text-sm font-semibold text-brand-900 hover:bg-surface rounded-lg transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              {t('nav.login')}
            </a>
            <a
              href={`/${locale}/register`}
              onClick={close}
              className="block w-full text-center px-3 py-2.5 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-950 rounded-xl transition-all duration-300 active:scale-[0.97] mt-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              {t('nav.signup')}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
