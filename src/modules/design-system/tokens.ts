/** Módulo 11 — design tokens (sincronizar con tailwind.config) */
export const designTokens = {
  colors: {
    brand: '#1e3a5f',
    primary: '#2563eb',
    success: '#16a34a',
    warning: '#f59e0b',
    destructive: '#dc2626',
  },
  radius: {
    card: '1rem',
    button: '0.75rem',
  },
  font: {
    sans: 'var(--font-geist-sans)',
  },
} as const;
