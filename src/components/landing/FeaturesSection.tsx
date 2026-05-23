'use client';

import { useInView } from '@/hooks/useInView';
import { useLocale, useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';

interface Feature {
  icon: React.ElementType;
  section: string;
  href: string;
}

const features: Feature[] = [
  { icon: LayoutDashboard, section: 'features.properties', href: '/dashboard' },
  { icon: Building2, section: 'features.contracts', href: '/properties' },
  { icon: Users, section: 'features.payments', href: '/dashboard/tenants' },
  { icon: CreditCard, section: 'features.portal', href: '/dashboard/payments' },
  { icon: FileText, section: 'features.reports', href: '/dashboard/leases' },
  { icon: Bell, section: 'features.ai', href: '/dashboard' },
  { icon: BarChart3, section: 'features.multitenant', href: '/dashboard' },
  { icon: UserCheck, section: 'features.maintenance', href: '/dashboard/tenant' },
  { icon: Shield, section: 'features.documents', href: '/dashboard/settings' },
];

function FeatureCard({ icon: Icon, section, href, index }: Feature & { index: number }) {
  const [ref, inView] = useInView<HTMLAnchorElement>({ threshold: 0.1 });
  const reduce = useReducedMotion();
  const t = useTranslations(section);
  const locale = useLocale();

  return (
    <motion.a
      ref={ref}
      href={`/${locale}${href}`}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: reduce ? 1 : 0, y: reduce ? 0 : 30 }}
      transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.08, ease: 'easeOut' }}
      className="group relative block bg-white rounded-2xl p-6 md:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 border border-[#e6edf5]"
    >
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#e6edf5] text-[#1e3a5f] mb-4 group-hover:bg-[#1e3a5f] group-hover:text-white transition-all duration-300">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-display font-bold text-[#1e293b] text-lg mb-1.5">{t('title')}</h3>
      <p className="text-[#64748b] text-sm leading-relaxed">{t('desc')}</p>
    </motion.a>
  );
}

export function FeaturesSection() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
  const t = useTranslations();

  return (
    <section ref={ref} id="features" className="relative py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e6edf5]/30 to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className={`text-center max-w-2xl mx-auto mb-14 md:mb-18 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-[0.2em]">
            {t('nav.features')}
          </span>
          <h2 className="font-display font-bold text-[#1e3a5f] text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-[#64748b] text-base md:text-lg leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.section} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
