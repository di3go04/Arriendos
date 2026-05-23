'use client';

import { useInView } from '@/hooks/useInView';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MousePointerClick } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#f59e0b]/10 to-transparent rounded-3xl blur-3xl" aria-hidden="true" />
      <svg viewBox="0 0 560 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-auto drop-shadow-2xl" aria-hidden="true">
        <rect x="60" y="30" width="440" height="360" rx="24" fill="white" stroke="#e6edf5" strokeWidth="2" />
        <rect x="60" y="30" width="440" height="64" rx="24" fill="#1e3a5f" />
        <rect x="60" y="78" width="440" height="16" fill="#1e3a5f" />
        <circle cx="88" cy="62" r="10" fill="white" fillOpacity={0.15} />
        <rect x="108" y="56" width="80" height="12" rx="4" fill="white" fillOpacity={0.15} />
        <circle cx="452" cy="62" r="8" fill="white" fillOpacity={0.12} />
        <circle cx="472" cy="62" r="8" fill="white" fillOpacity={0.12} />
        <rect x="80" y="116" width="180" height="88" rx="12" fill="white" stroke="#e6edf5" strokeWidth="1.5" />
        <rect x="96" y="132" width="50" height="10" rx="3" fill="#e6edf5" />
        <rect x="96" y="150" width="72" height="24" rx="6" fill="#1e3a5f" />
        <rect x="96" y="180" width="120" height="8" rx="3" fill="#e6edf5" />
        <rect x="280" y="116" width="200" height="88" rx="12" fill="white" stroke="#e6edf5" strokeWidth="1.5" />
        <rect x="296" y="132" width="60" height="10" rx="3" fill="#e6edf5" />
        <rect x="296" y="150" width="96" height="24" rx="6" fill="#f59e0b" />
        <rect x="296" y="180" width="140" height="8" rx="3" fill="#e6edf5" />
        <rect x="80" y="228" width="400" height="144" rx="12" fill="white" stroke="#e6edf5" strokeWidth="1.5" />
        <rect x="96" y="244" width="70" height="10" rx="3" fill="#e6edf5" />
        <rect x="96" y="262" width="100" height="8" rx="3" fill="#e6edf5" fillOpacity={0.6} />
        <rect x="110" y="295" width="28" height="55" rx="4" fill="#f59e0b" fillOpacity={0.7} />
        <rect x="155" y="275" width="28" height="75" rx="4" fill="#f59e0b" fillOpacity={0.7} />
        <rect x="200" y="250" width="28" height="100" rx="4" fill="#1e3a5f" fillOpacity={0.4} />
        <rect x="245" y="265" width="28" height="85" rx="4" fill="#f59e0b" fillOpacity={0.7} />
        <rect x="290" y="240" width="28" height="110" rx="4" fill="#1e3a5f" fillOpacity={0.4} />
        <rect x="335" y="285" width="28" height="65" rx="4" fill="#f59e0b" fillOpacity={0.7} />
        <rect x="380" y="260" width="28" height="90" rx="4" fill="#1e3a5f" fillOpacity={0.4} />
        <rect x="425" y="280" width="28" height="70" rx="4" fill="#f59e0b" fillOpacity={0.7} />
      </svg>
    </div>
  );
}

export function HeroSection() {
  const [heroRef, heroInView] = useInView<HTMLDivElement>({ threshold: 0, once: true });
  const reduce = useReducedMotion();
  const t = useTranslations();
  const locale = useLocale();

  const fadeUp = (d: number) =>
    reduce
      ? { opacity: 1 }
      : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: d, ease: 'easeOut' as const } };

  return (
    <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f] to-[#152e4a]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" aria-hidden="true" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#f59e0b]/5 blur-[120px]" aria-hidden="true" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[100px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div {...fadeUp(0)} className={heroInView ? '' : 'opacity-0'}>
            <motion.span
              {...fadeUp(0.1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-4 py-1.5 rounded-full uppercase tracking-wider mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
              {t('hero.tagline', { defaultValue: 'Plataforma profesional de arrendamientos' })}
            </motion.span>
            <motion.h1
              {...fadeUp(0.2)}
              className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-5"
            >
              {t('hero.title')}
            </motion.h1>
            <motion.p
              {...fadeUp(0.3)}
              className="text-base md:text-lg text-white/70 leading-relaxed max-w-lg mb-8"
            >
              {t('hero.subtitle')}
            </motion.p>
            <motion.div {...fadeUp(0.4)} className="flex flex-wrap items-center gap-4">
              <a
                href={`/${locale}/register`}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1e3a5f] bg-[#f59e0b] hover:bg-[#d97706] px-6 py-3.5 rounded-xl shadow-[0_4px_14px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                {t('hero.cta')}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={`/${locale}/demo`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border-2 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 px-6 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                <MousePointerClick className="w-4 h-4" />
                {t('hero.demo')}
              </a>
            </motion.div>
          </motion.div>
          <motion.div
            {...fadeUp(0.3)}
            className={`hidden lg:block ${heroInView ? '' : 'opacity-0'}`}
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
