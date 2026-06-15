'use client';

import { useEffect, useRef } from 'react';
import { translate, useI18n } from '@/lib/i18n';

export default function Hero() {
  const { lang } = useI18n();
  const sectionRef = useRef(null);
  const mockupRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mockup = mockupRef.current;
    if (!mockup) return;
    function handleScroll() {
      const rect = mockup.getBoundingClientRect();
      const offset = rect.top - window.innerHeight;
      if (offset < 0 && rect.bottom > 0) {
        mockup.style.transform = `translateY(${offset * -0.12}px)`;
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = (key) => translate(key, lang);

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gray-50 dark:bg-rn-900 pt-20 lg:pt-28 pb-24 md:py-32 transition-colors duration-300"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute bottom-1/4 left-0 w-[450px] h-[450px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100 dark:to-rn-800 transition-colors duration-300" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div ref={sectionRef} className="fade-on-scroll">
            <h1 className="font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-yellow-800 to-accent dark:from-white dark:via-yellow-100 dark:to-accent bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-white/70 leading-relaxed mb-10 max-w-lg">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <a
                href="#"
                className="inline-flex items-center gap-2 py-4 md:py-5 px-8 text-base font-semibold rounded-pill bg-accent hover:bg-accent-hover text-rn-900 transition-all duration-300 hover:shadow-gold hover:scale-[1.03]"
              >
                {t('hero.cta')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 py-4 md:py-5 px-8 text-base font-semibold rounded-pill border border-gray-300 dark:border-white/25 text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-300 hover:shadow-lg hover:scale-[1.03]"
              >
                {t('hero.demo')}
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500 dark:text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{t('hero.benefit1')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{t('hero.benefit2')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('hero.benefit3')}</span>
              </span>
            </div>
          </div>

          <div ref={mockupRef} className="relative hidden lg:block">
            <div className="absolute -inset-8 bg-accent/5 rounded-3xl blur-3xl" aria-hidden="true" />
            <div className="relative bg-white dark:bg-rn-700 rounded-2xl border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl dark:shadow-black/40 overflow-hidden transition-colors duration-300">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-4 flex-1 h-6 rounded-md bg-gray-100 dark:bg-white/5 flex items-center px-3">
                  <span className="text-[11px] text-gray-400 dark:text-white/30">app.rentnow.app</span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm font-bold">LA</div>
                  <div className="flex-1">
                    <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-white/10" />
                    <div className="h-2.5 w-20 rounded-full bg-gray-100 dark:bg-white/5 mt-1.5" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                    <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-white/10 mb-3" />
                    <div className="h-8 w-20 rounded bg-accent/20 mb-1" />
                    <div className="h-2 w-14 rounded-full bg-gray-100 dark:bg-white/5" />
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                    <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-white/10 mb-3" />
                    <div className="h-8 w-16 rounded bg-blue-500/20 mb-1" />
                    <div className="h-2 w-14 rounded-full bg-gray-100 dark:bg-white/5" />
                  </div>
                </div>
                <div className="bg-gray-50/50 dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-white/10" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/10" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    <div className="flex-1 bg-accent/30 rounded-t-md" style={{ height: '60%' }} />
                    <div className="flex-1 bg-accent/20 rounded-t-md" style={{ height: '40%' }} />
                    <div className="flex-1 bg-accent/40 rounded-t-md" style={{ height: '75%' }} />
                    <div className="flex-1 bg-accent/25 rounded-t-md" style={{ height: '55%' }} />
                    <div className="flex-1 bg-accent/50 rounded-t-md" style={{ height: '90%' }} />
                    <div className="flex-1 bg-accent/35 rounded-t-md" style={{ height: '65%' }} />
                    <div className="flex-1 bg-accent/20 rounded-t-md" style={{ height: '35%' }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center px-4">
                    <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-white/10" />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
