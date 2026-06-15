'use client';

import { useI18n } from '@/lib/i18n';

export default function LanguageSelector({ mobile, onAction }) {
  const { lang, toggleLang } = useI18n();

  function handleClick() {
    toggleLang();
    if (onAction) onAction();
  }

  const baseClass = mobile
    ? 'flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer w-full text-left'
    : 'flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer';

  return (
    <button onClick={handleClick} className={baseClass} aria-label="Toggle language">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{lang === 'es' ? 'EN' : 'ES'}</span>
    </button>
  );
}
