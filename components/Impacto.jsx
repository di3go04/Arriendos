'use client';

import { useEffect, useRef, useState } from 'react';
import { translate, useI18n } from '@/lib/i18n';

function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          function tick() {
            current += increment;
            if (current > target) current = target;
            setCount(Math.round(current));
            if (current < target) requestAnimationFrame(tick);
          }
          tick();
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white">
      {count}{suffix}
    </span>
  );
}

function ImpactCard({ icon, target, suffix, labelKey, descKey, delay, className }) {
  const { lang } = useI18n();
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`fade-on-scroll bg-white dark:bg-rn-700 border border-gray-200 dark:border-white/5 rounded-2xl p-8 md:p-10 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 ${className || ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
        {icon}
      </div>
      <Counter target={target} suffix={suffix} />
      <span className="text-lg font-semibold text-accent block my-3">
        {translate(labelKey, lang)}
      </span>
      <p className="text-gray-600 dark:text-white/60 leading-relaxed text-sm md:text-base">
        {translate(descKey, lang)}
      </p>
    </div>
  );
}

export default function Impacto() {
  const { lang } = useI18n();
  const titleRef = useRef(null);

  useEffect(() => {
    const el = titleRef.current;
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

  const t = (key) => translate(key, lang);

  return (
    <section id="impacto" className="relative py-24 md:py-32 bg-gray-100 dark:bg-rn-800 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div ref={titleRef} className="text-center max-w-3xl mx-auto mb-16 md:mb-20 fade-on-scroll">
          <h2 className="font-extrabold text-4xl md:text-5xl tracking-tight text-gray-900 dark:text-white mb-4">
            {t('impact.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-white/60 max-w-xl mx-auto">
            {t('impact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ImpactCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            target={94}
            suffix="%"
            labelKey="impact.card1_label"
            descKey="impact.card1_desc"
            delay={0}
          />
          <ImpactCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            target={24}
            suffix="/7"
            labelKey="impact.card2_label"
            descKey="impact.card2_desc"
            delay={150}
            className="md:translate-y-6"
          />
          <ImpactCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
            target={85}
            suffix="h"
            labelKey="impact.card3_label"
            descKey="impact.card3_desc"
            delay={300}
          />
        </div>
      </div>
    </section>
  );
}
