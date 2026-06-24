export const colors = {
  primary: '#2563EB',
  secondary: '#1D4ED8',
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
} as const

export type ColorKey = keyof typeof colors
