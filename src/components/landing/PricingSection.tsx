'use client';

import { useInView } from '@/hooks/useInView';
import { useLocale, useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

interface Plan {
  nameKey: string;
  price: string;
  periodKey: string;
  popular: boolean;
  featureKeys: string[];
  ctaKey: string;
  href: string;
}

const plans: Plan[] = [
  {
    nameKey: 'pricing.plan_basic',
    price: '$0',
    periodKey: '',
    popular: false,
    featureKeys: [
      'pricing.feature_properties_2',
      'pricing.feature_tenants_2',
      'pricing.feature_basic_templates',
      'pricing.feature_email_reminders',
      'pricing.feature_basic_dashboard',
    ],
    ctaKey: 'pricing.cta.basic',
    href: '/register?plan=basico',
  },
  {
    nameKey: 'pricing.plan_pro',
    price: '$12',
    periodKey: 'pricing.monthly',
    popular: true,
    featureKeys: [
      'pricing.feature_properties_10',
      'pricing.feature_unlimited_tenants',
      'pricing.feature_ai_templates',
      'pricing.feature_digital_signature',
      'pricing.feature_auto_reminders',
      'pricing.feature_priority_support',
      'pricing.feature_reports',
      'pricing.feature_api',
    ],
    ctaKey: 'pricing.cta.pro',
    href: '/precios',
  },
  {
    nameKey: 'pricing.plan_business',
    price: '$24',
    periodKey: 'pricing.monthly',
    popular: false,
    featureKeys: [
      'pricing.feature_unlimited_properties',
      'pricing.feature_unlimited_tenants',
      'pricing.feature_all_pro',
      'pricing.feature_multi_user',
      'pricing.feature_support_24_7',
      'pricing.feature_white_label',
    ],
    ctaKey: 'pricing.cta.business',
    href: '/precios',
  },
];

function PlanCard({ plan, index, inView }: { plan: Plan; index: number; inView: boolean }) {
  const reduce = useReducedMotion();
  const t = useTranslations();
  const locale = useLocale();

  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.12, ease: 'easeOut' }}
      className={`relative bg-white rounded-card overflow-hidden border ${
        plan.popular
          ? 'border-[#f5e0b]/30 ring-2 ring-[#f59e0b]/20 shadow-card-hover md:-mt-4 md:mb-4'
          : 'border-[#e6edf5] shadow-card hover:shadow-card-hover hover:-translate-y-1'
      } transition-all duration-300`}
    >
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-[#f59e0b] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
          {t('pricing.popular')}
        </div>
      )}

      <div className="p-6 sm:p-8 border-b border-[#e6edf5]">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-[#f59e0b]/10 text-[#1e3a5f] text-xs font-bold px-2.5 py-1 rounded-lg">
            {t(plan.nameKey)}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-black text-[#1e293b]">{plan.price}</span>
          <span className="text-xs font-bold text-[#64748b]">USD{plan.periodKey ? t(plan.periodKey) : ''}</span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-4">
          {t('pricing.features')}
        </p>
        <ul className="space-y-3">
          {plan.featureKeys.map((fk) => (
            <li key={fk} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
              <span className="text-xs font-semibold text-[#1e293b]">{t(fk)}</span>
            </li>
          ))}
        </ul>

        <a
          href={`/${locale}${plan.href}`}
          className={`mt-6 w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            plan.popular
              ? 'bg-[#1e3a5f] text-white hover:bg-[#152e4a] shadow-btn-hover'
              : 'bg-[#f8fafc] text-[#1e293b] border border-[#e6edf5] hover:bg-[#e6edf5] shadow-card'
          }`}
        >
          {t(plan.ctaKey)}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}

export function PricingSection() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
  const t = useTranslations();

  return (
    <section ref={ref} id="pricing" className="relative py-20 md:py-28 bg-gradient-to-b from-white to-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-[0.2em]">{t('nav.pricing')}</span>
          <h2 className="font-display font-bold text-[#1e3a5f] text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-[#64748b] text-base md:text-lg leading-relaxed">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <PlanCard key={plan.nameKey} plan={plan} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
