'use client';

import { translate, useI18n } from '@/lib/i18n';

export default function Footer() {
  const { lang, toggleLang } = useI18n();

  const t = (key) => translate(key, lang);

  return (
    <footer className="border-t border-gray-200 dark:border-white/5 bg-white dark:bg-rn-900 py-10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-bold text-gray-900 dark:text-white">RentNow</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-white/40">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm text-gray-800 dark:text-white/80">
              {t('footer.product')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-white/40">
              <li>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.features')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.pricing')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">API</a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.demo')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm text-gray-800 dark:text-white/80">
              {t('footer.company')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-white/40">
              <li>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog</a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm text-gray-800 dark:text-white/80">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-white/40">
              <li>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('footer.terms')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-white/40">
            {t('footer.copyright')}
          </p>
          <button
            onClick={toggleLang}
            className="text-sm text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 transition-colors cursor-pointer"
          >
            {lang === 'es' ? 'English' : 'Español'}
          </button>
        </div>
      </div>
    </footer>
  );
}
