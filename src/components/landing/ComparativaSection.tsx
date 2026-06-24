'use client';

import { useInView } from '@/hooks/useInView';
import { Check, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const competitors = [
  { name: 'RentNow', features: { ai: true, portal: true, multiCurrency: true, pwa: true, multiLang: true, free: true }, priceKey: 'pricing.free' },
  { name: 'Rentila', features: { ai: false, portal: false, multiCurrency: false, pwa: false, multiLang: false, free: true }, price: '€8/mes' },
  { name: 'Stessa', features: { ai: false, portal: false, multiCurrency: false, pwa: false, multiLang: false, free: true }, priceKey: 'pricing.free' },
  { name: 'Buildium', features: { ai: false, portal: false, multiCurrency: false, pwa: false, multiLang: false, free: true }, price: '$52/mes' },
];

const featureLabelKeys = ['ai', 'portal', 'multiCurrency', 'pwa', 'multiLang', 'free'];

export function ComparativaSection() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section ref={ref} className="relative py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className={`text-center max-w-2xl mx-auto mb-14 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em]">{t('comparing.title')}</span>
          <h2 className="font-display font-bold text-brand-900 text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4">
            {t('comparing.heading_prefix')}<span className="text-amber-500">{t('comparing.heading_highlight')}</span>
          </h2>
          <p className="text-text-muted text-base md:text-lg leading-relaxed">
            {t('comparing.subtitle')}
          </p>
        </div>

        <div className="overflow-x-auto max-w-5xl mx-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-border-subtle">
                <th className="p-4 text-sm font-bold text-brand-800 w-48">{t('nav.features')}</th>
                {competitors.map((c) => (
                  <th key={c.name} className={`p-4 text-sm font-bold ${c.name === 'RentNow' ? 'text-amber-500' : 'text-text-muted'}`}>
                    {c.name}
                    <span className="block text-[10px] font-normal text-text-subtle mt-0.5">
                      {c.price ? c.price : t(c.priceKey || '')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {featureLabelKeys.map((key) => (
                <tr key={key} className="hover:bg-surface transition-colors duration-200">
                  <td className="p-4 text-sm font-semibold text-brand-800">{t(`comparing.features.${key}`)}</td>
                  {competitors.map((c) => (
                    <td key={c.name} className="p-4">
                      {c.features[key as keyof typeof c.features] ? (
                        <Check className="w-5 h-5 text-success" />
                      ) : (
                        <X className="w-5 h-5 text-neutral-300" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-surface">
                <td className="p-4" />
                {competitors.map((c) => (
                  <td key={c.name} className="p-4">
                    {c.name === 'RentNow' ? (
                      <a
                        href={`/${locale}/register`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-brand-900 px-4 py-2 rounded-lg hover:bg-brand-950 transition-all duration-300 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                      >
                        {t('pricing.cta.basic')}
                      </a>
                    ) : (
                      <span className="text-xs text-text-subtle">{t('comparing.free_dash')}</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
