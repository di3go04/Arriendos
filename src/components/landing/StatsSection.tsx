'use client';

import { Loader } from '@/components/ui/Loader';
import { useInView } from '@/hooks/useInView';
import { useTranslation } from '@/context/I18nContext';
import { motion,useReducedMotion } from 'framer-motion';
import {
ArrowRight,
Building2,
Clock,
CreditCard,
FileText,
TrendingUp,
Users,
} from 'lucide-react';
import { useEffect,useState } from 'react';

interface StatItem {
  icon: string;
  value: number;
  label: string;
}

interface StatsResponse {
  authenticated: boolean;
  data: StatItem[] | null;
}

const iconMap: Record<string, React.ElementType> = {
  Building2,
  FileText,
  Users,
  CreditCard,
  Clock,
};

// Map known Spanish stat labels to translation keys
const labelKeyMap: Record<string, string> = {
  'Propiedades registradas': 'hero.stats.properties',
  'Tus propiedades': 'hero.stats.properties',
  'Contratos activos': 'contracts.title',
  'Arrendatarios': 'tenants.title',
  'Pagos este mes': 'payments.title',
  'Mis contratos': 'contracts.title',
  'Pendientes': 'payments.status_pending',
};

function AnimatedStatValue({ value, inView: isVisible }: { value: number; inView: boolean }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isVisible || reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }
    const startTime = performance.now();
    const duration = 1200;
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, isVisible, reduce]);

  return (
    <span className="font-display font-bold text-white text-4xl md:text-5xl tracking-tight mb-1 tabular-nums">
      {display.toLocaleString()}
    </span>
  );
}

export function StatsSection() {
  const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.2, once: true });
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();
  const { locale, t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch('/api/stats')
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="relative bg-[#1e3a5f] py-16 md:py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 md:px-8 flex justify-center">
          <Loader variant="inline" size="md" text={t('actions.loading')} />
        </div>
      </section>
    );
  }

  const stats: StatItem[] = data?.data ?? [];
  const hasData = data?.authenticated && stats.length > 0 && stats.some((s) => s.value > 0);

  // Translate stat labels dynamically
  const translateLabel = (label: string): string => {
    const key = labelKeyMap[label];
    return key ? t(key) : label;
  };

  return (
    <section ref={statsRef} className="relative bg-[#1e3a5f] py-16 md:py-20 overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#f59e0b]/5 blur-[100px]" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/[0.02] blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        {hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((s, i) => {
              const Icon = iconMap[s.icon] || Building2;
              return (
                <motion.div
                  key={s.label}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : { opacity: reduce ? 1 : 0, y: reduce ? 0 : 30 }}
                  transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.1, ease: 'easeOut' }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#f59e0b]/10 text-[#f59e0b] mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <AnimatedStatValue value={s.value} inView={statsInView} />
                  <div className="text-white/60 text-sm md:text-base mt-1">{translateLabel(s.label)}</div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center max-w-lg mx-auto">
            <TrendingUp className="w-10 h-10 text-[#f59e0b]/40 mx-auto mb-4" />
            <h3 className="font-display font-bold text-white text-xl mb-2">
              {data?.authenticated ? t('stats.authenticated_title') : t('stats.guest_title')}
            </h3>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              {data?.authenticated ? t('stats.authenticated_desc') : t('stats.guest_desc')}
            </p>
            <a
              href={data?.authenticated ? `/${locale}/properties` : `/${locale}/register`}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#1e3a5f] bg-[#f59e0b] hover:bg-[#d97706] px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {data?.authenticated ? t('stats.authenticated_cta') : t('stats.guest_cta')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
