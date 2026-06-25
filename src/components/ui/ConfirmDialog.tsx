'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import PremiumButton from './PremiumButton'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmColors: Record<string, string> = {
    danger: 'bg-error hover:brightness-110',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-primary hover:brightness-110',
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative bg-background border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-error/10 p-2.5">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <PremiumButton variant="ghost" size="sm" onClick={onClose}>
                {cancelLabel}
              </PremiumButton>
              <PremiumButton
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
              >
                {confirmLabel}
              </PremiumButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
