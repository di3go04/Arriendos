'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface PremiumButtonProps extends Omit<HTMLMotionProps<'button'>, 'size' | 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none'

    const variants: Record<string, string> = {
      primary:
        'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm',
      outline:
        'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground',
      ghost:
        'text-muted-foreground hover:text-foreground hover:bg-muted',
      danger:
        'bg-error text-error-foreground shadow-md shadow-error/20 hover:shadow-lg hover:shadow-error/30',
      gradient:
        'bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35',
    }

    const sizes: Record<string, string> = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-sm',
      lg: 'h-13 px-8 text-base',
    }

    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { scale: 1.03, y: -2 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    )
  }
)
PremiumButton.displayName = 'PremiumButton'

export default PremiumButton
