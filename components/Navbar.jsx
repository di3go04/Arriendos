'use client';

import { useState, useRef, useEffect } from 'react';
import { translate, useI18n } from '@/lib/i18n';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const t = (key) => translate(key, lang);

  const links = [
    { key: 'nav.home', href: '#hero' },
    { key: 'nav.features', href: '#impacto' },
    { key: 'nav.impact', href: '#impacto' },
    { key: 'nav.contact', href: '#contacto' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-rn-800/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-lg font-bold text-gray-900 dark:text-white">RentNow</span>
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="font-medium text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t(link.key)}
            </a>
          ))}
          <LanguageSelector />
          <ThemeToggle />
          <a
            href="#"
            className="px-5 py-2 text-sm font-semibold rounded-pill border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-300"
          >
            {t('nav.login')}
          </a>
          <a
            href="#"
            className="px-5 py-2.5 text-sm font-semibold rounded-pill bg-accent hover:bg-accent-hover text-rn-900 transition-all duration-300 hover:shadow-gold hover:scale-[1.03]"
          >
            {t('nav.start')}
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        ref={menuRef}
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? 'max-h-96 border-t border-gray-200 dark:border-white/5' : 'max-h-0'
        }`}
      >
        <div className="bg-white dark:bg-rn-800 transition-colors duration-300 px-4 py-3 space-y-1">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={closeMenu}
              className="block rounded-lg px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              {t(link.key)}
            </a>
          ))}
          <LanguageSelector mobile onAction={closeMenu} />
          <a
            href="#"
            onClick={closeMenu}
            className="block rounded-lg px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            {t('nav.login')}
          </a>
          <a
            href="#"
            onClick={closeMenu}
            className="mt-2 block w-full text-center px-5 py-2.5 text-sm font-semibold rounded-pill bg-accent hover:bg-accent-hover text-rn-900 transition-all duration-300"
          >
            {t('nav.start')}
          </a>
        </div>
      </div>
    </nav>
  );
}
