import { cn } from '@/lib/utils'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, asChild, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.96] cursor-pointer'

    const variants: Record<string, string> = {
      primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm hover:shadow-md hover:-translate-y-0.5',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-sm',
      ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
      danger: 'bg-error text-error-foreground hover:brightness-110 shadow-sm hover:shadow-md hover:-translate-y-0.5',
    }

    const sizes: Record<string, string> = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-13 px-7 text-base',
    }

  if (asChild) {
    return <>{children}</>
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
