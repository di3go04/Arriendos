'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
}

const emojis: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
}

const colors: Record<ToastType, string> = {
  success: 'border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/30',
  error: 'border-red-400/40 bg-red-50 dark:bg-red-950/30',
  info: 'border-blue-400/40 bg-blue-50 dark:bg-blue-950/30',
  warning: 'border-amber-400/40 bg-amber-50 dark:bg-amber-950/30',
}

let globalAddToast: ((t: Omit<Toast, 'id'>) => void) | null = null

export function toast(t: Omit<Toast, 'id'>) {
  if (globalAddToast) globalAddToast(t)
}

export default function ToastPremium() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = (++counterRef.current).toString()
    setToasts(prev => [...prev, { ...t, id }])
    const duration = t.duration ?? 4000
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), duration)
  }, [])

  useEffect(() => {
    globalAddToast = addToast
    return () => { globalAddToast = null }
  }, [addToast])

  const remove = (id: string) => setToasts(prev => prev.filter(x => x.id !== id))

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-background p-4 shadow-lg',
              colors[t.type]
            )}
          >
            <span className="text-lg leading-none shrink-0 mt-0.5">{emojis[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.message}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
