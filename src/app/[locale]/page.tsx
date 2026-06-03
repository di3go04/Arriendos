'use client';

import { ComparativaSection } from '@/components/landing/ComparativaSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const footerLinks = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.features', href: '#features' },
  { key: 'nav.pricing', href: '/precios' },
  { key: 'nav.developers', href: '/developers' },
  { key: 'nav.properties', href: '/propiedades' },
];

export default function LocaleHomePage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#1e293b]">
      <nav className="relative z-50 border-b border-[#e6edf5] bg-white/80 backdrop-blur-md" aria-label="Navegación principal">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-5 md:px-8 h-16">
          <a href={`/${locale}`}><Logo /></a>
          <div className="hidden md:flex items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.key}
                href={link.href.startsWith('/') ? `/${locale}${link.href}` : link.href}
                className="text-sm font-medium text-[#64748b] hover:text-[#1e3a5f] transition-colors duration-200"
              >
                {t(link.key)}
              </a>
            ))}
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${locale}/login`}
              className="hidden sm:inline-flex text-sm font-semibold text-[#1e3a5f] hover:text-[#152e4a] transition-colors duration-200 px-4 py-2"
            >
              {t('nav.login')}
            </a>
            <a
              href={`/${locale}/register`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-[#152e4a] px-5 py-2.5 rounded-xl shadow-[0_2px_4px_rgba(30,58,95,0.15)] hover:shadow-[0_4px_12px_rgba(30,58,95,0.25)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('nav.signup')}
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      <HeroSection />
      <FeaturesSection />
      <ComparativaSection />
      <PricingSection />
      <StatsSection />
      <FAQSection />

      <section className="bg-gradient-to-r from-[#1e3a5f] to-[#152e4a] py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 md:px-8 text-center">
          <h2 className="font-display font-bold text-white text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-white/60 text-base md:text-lg mb-8 max-w-xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <a
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1e3a5f] bg-[#f59e0b] hover:bg-[#d97706] px-8 py-4 rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            {t('cta.button')}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <footer className="bg-[#1e3a5f] text-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-10">
            <div className="flex flex-col items-center md:items-start gap-3">
              <a href={`/${locale}`}><Logo className="[&_span]:text-white" /></a>
              <p className="text-white/60 text-sm max-w-xs text-center md:text-left leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {footerLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href.startsWith('/') ? `/${locale}${link.href}` : link.href}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
                >
                  {t(link.key)}
                </a>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Rentnow. {t('footer.rights')}
          </div>
        </div>
      </footer>
    </main>
  );
}