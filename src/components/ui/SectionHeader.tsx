'use client';

import { useInView } from '@/hooks/useInView';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  badge: string;
  title: ReactNode;
  subtitle?: string;
  light?: boolean;
}

export function SectionHeader({ badge, title, subtitle, light }: SectionHeaderProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
  const reduce = useReducedMotion();

  return (
    <div
      ref={ref}
      className={`text-center max-w-2xl mx-auto mb-14 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <motion.span
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em]"
      >
        {badge}
      </motion.span>
      <motion.h2
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4 ${
          light ? 'text-white' : 'text-brand-900'
        }`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`text-base md:text-lg leading-relaxed ${light ? 'text-white/70' : 'text-text-muted'}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
