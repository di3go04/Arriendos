'use client'

import { useInView } from '@/hooks/useInView';
import { useLocale, useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    key: 'starter',
    price: '0',
    features: ['hasta_5', 'contratos_basica', 'cobranza_manual', 'dashboard_basico'],
    ctaKey: 'pricing.cta.basic',
    popular: false,
  },
  {
    key: 'profesional',
    price: '49',
    popular: true,
    features: [
      'propiedades_ilimitadas', 'open_banking_kyc', 'firma_electronica',
      'conciliacion', 'api_rest', 'dashboard_avanzado',
    ],
    ctaKey: 'pricing.cta.pro',
  },
  {
    key: 'enterprise',
    price: '149',
    popular: false,
    features: [
      'todo_profesional', 'voice_agents', 'reas_coliving',
      'esg_dashboard', 'soporte_247', 'onboarding',
    ],
    ctaKey: 'pricing.cta.business',
  },
] as const;

export function PricingSection() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
  const reduce = useReducedMotion();
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section ref={ref} id="precios" className="relative py-20 md:py-28 bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-surface to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-xs font-bold text-gold-400 uppercase tracking-[0.2em]">
            {t('nav.pricing')}
          </span>
          <h2 className="font-display font-bold text-brand-900 text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-text-muted text-base md:text-lg leading-relaxed">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.1, ease: 'easeOut' }}
              className={`relative flex flex-col bg-white rounded-2xl border p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? 'border-gold-400 shadow-[0_0_0_1px_rgba(240,185,11,0.3),0_8px_25px_rgba(240,185,11,0.12)]'
                  : 'border-border-subtle shadow-card hover:shadow-card-hover'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-4 py-1 text-[11px] font-bold text-brand-900 whitespace-nowrap">
                  {t('pricing.popular')}
                </div>
              )}

              <div className="mb-2">
                <h3 className="font-display font-bold text-brand-900 text-xl">
                  {plan.key === 'starter' && t('pricing.plan_basic', { defaultValue: 'Starter' })}
                  {plan.key === 'profesional' && t('pricing.plan_pro', { defaultValue: 'Profesional' })}
                  {plan.key === 'enterprise' && t('pricing.plan_business', { defaultValue: 'Enterprise' })}
                </h3>
                <p className="text-text-muted text-sm mt-1">
                  {plan.key === 'starter' && 'Para arrendadores individuales'}
                  {plan.key === 'profesional' && 'Para agentes y pequeñas firmas'}
                  {plan.key === 'enterprise' && 'Para portafolios grandes'}
                </p>
              </div>

              <div className="mt-4 mb-6">
                <span className="font-display font-bold text-brand-900 text-4xl tracking-tight">
                  ${plan.price}
                </span>
                {plan.price !== '0' && (
                  <span className="text-text-muted text-sm ml-1">/mes</span>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => {
                  const keyMap: Record<string, string> = {
                    hasta_5: 'pricing.feature_properties_10',
                    contratos_basica: 'pricing.feature_basic_templates',
                    cobranza_manual: 'pricing.feature_email_reminders',
                    dashboard_basico: 'pricing.feature_basic_dashboard',
                    propiedades_ilimitadas: 'pricing.feature_unlimited_properties',
                    open_banking_kyc: 'pricing.feature_properties_2',
                    firma_electronica: 'pricing.feature_digital_signature',
                    conciliacion: 'pricing.feature_reports',
                    api_rest: 'pricing.feature_api',
                    dashboard_avanzado: 'pricing.feature_multi_user',
                    todo_profesional: 'pricing.feature_all_pro',
                    voice_agents: 'pricing.feature_ai_templates',
                    reas_coliving: 'pricing.feature_unlimited_tenants',
                    esg_dashboard: 'pricing.feature_reports',
                    soporte_247: 'pricing.feature_support_24_7',
                    onboarding: 'pricing.feature_training',
                  };
                  const msgKey = keyMap[f] || f;
                  return (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-brand-700">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {t(msgKey, { defaultValue: f })}
                    </li>
                  );
                })}
              </ul>

              <a
                href={`/${locale}/register`}
                className={`inline-flex items-center justify-center gap-2 text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
                  plan.popular
                    ? 'text-brand-900 bg-gold-400 hover:bg-gold-500 shadow-[0_4px_14px_rgba(240,185,11,0.35)] hover:shadow-[0_6px_20px_rgba(240,185,11,0.45)] hover:-translate-y-0.5'
                    : 'text-brand-900 bg-brand-50 hover:bg-brand-100 border border-border-subtle hover:border-brand-200 hover:-translate-y-0.5'
                }`}
              >
                {t(plan.ctaKey)}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
