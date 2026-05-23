'use client';

import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddings = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 md:p-8',
};

export function Card({ children, className = '', hover = true, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-2xl',
        paddings[padding],
        'shadow-card transition-all duration-300',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-border-subtle pb-4 mb-5', className)}>
      {children}
    </div>
  );
}

export function CardMetric({ label, value, icon, trend }: { label: string; value: string; icon?: React.ReactNode; trend?: { dir: 'up' | 'down'; text: string } }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className="p-3 rounded-xl bg-brand-subtle border border-border text-brand">
            {icon}
          </div>
        )}
        {trend && (
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full',
            trend.dir === 'up' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
          )}>
            {trend.text}
          </span>
        )}
      </div>
      <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">{label}</span>
      <span className="block text-4xl font-bold tracking-tight text-foreground mt-1 tabular-nums">{value}</span>
    </div>
  );
}
