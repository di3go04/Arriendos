'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover shadow-btn hover:shadow-btn-hover',
  secondary:
    'border-2 border-primary text-primary hover:bg-primary-subtle',
  danger:
    'bg-destructive text-destructive-foreground hover:bg-[#DC2626] shadow-[0_2px_4px_rgba(239,68,68,0.15)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)]',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-muted hover:text-foreground',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px] font-semibold rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-[13px] font-semibold rounded-[10px] gap-2',
  lg: 'px-6 py-3 text-sm font-bold rounded-[12px] gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center',
        'transition-all duration-150',
        'outline-none focus:outline-none focus:ring-2 focus:ring-primary-ring',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
