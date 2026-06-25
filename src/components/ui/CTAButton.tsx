import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  showArrow?: boolean;
  className?: string;
}

export function CTAButton({ href, children, variant = 'primary', showArrow = true, className = '' }: CTAButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all duration-300 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2';

  const styles: Record<string, string> = {
    primary:
      'text-brand-900 bg-amber-500 hover:bg-amber-600 shadow-[0_4px_14px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 focus-visible:outline-white',
    secondary:
      'text-white border-2 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5 focus-visible:outline-amber-500',
  };

  return (
    <a href={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
      {showArrow && <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
    </a>
  );
}
