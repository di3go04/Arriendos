'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Building2, X, CheckCircle, ExternalLink, Loader2, FlaskConical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

const BANKS = [
  { id: 'erebor_ni', name: 'Banco Nacional', logo: '🏦' },
  { id: 'erebor_retail', name: 'Banco Retail', logo: '🏛️' },
  { id: 'ganga_mx', name: 'Banco del Sur', logo: '🏦' },
  { id: 'bnk_mx', name: 'Banco Continental', logo: '🏛️' },
]

interface BankConnectProps {
  open: boolean
  onClose: () => void
  onConnected: () => void
}

const IS_DEMO = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  : false

export function BankConnect({ open, onClose, onConnected }: BankConnectProps) {
  const t = useTranslations('VERIFICATION_PAGE')
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'connecting' | 'success' | 'error'>('select')
  const [errorMsg, setErrorMsg] = useState('')

  const handleConnect = useCallback(async () => {
    if (!selectedBank) return
    setStep('connecting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/belvo/verify-income', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setStep('success')
        setTimeout(() => {
          onConnected()
          onClose()
          setStep('select')
          setSelectedBank(null)
        }, 2000)
      } else {
        setStep('error')
        setErrorMsg(data.error || 'Error al conectar el banco')
      }
    } catch {
      setStep('error')
      setErrorMsg('Error de conexión. Intenta de nuevo.')
    }
  }, [selectedBank, onConnected, onClose])

  const reset = useCallback(() => {
    setStep('select')
    setSelectedBank(null)
    setErrorMsg('')
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget && step !== 'connecting') onClose() }}
        >
          <motion.div
            className="w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {step === 'success' ? t('bank_connected_title') : t('connect_bank')}
              </h3>
              {step !== 'connecting' && (
                <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="p-4">
              {IS_DEMO && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-300">
                  <FlaskConical className="h-4 w-4 shrink-0" />
                  <span>Demo — Belvo Open Banking no está conectado. En producción, configura <code className="rounded bg-amber-200/50 px-1 font-mono text-[10px] dark:bg-amber-900/50">BELVO_SECRET_ID</code> y <code className="rounded bg-amber-200/50 px-1 font-mono text-[10px] dark:bg-amber-900/50">BELVO_SECRET_PASSWORD</code>.</span>
                </div>
              )}
              {step === 'select' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('bank_select_desc')}
                  </p>
                  <div className="space-y-2">
                    {BANKS.map(bank => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank.id)}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3 transition-all text-left ${
                          selectedBank === bank.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-2xl">{bank.logo}</span>
                        <span className="font-medium text-sm flex-1">{bank.name}</span>
                        {selectedBank === bank.id && (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={handleConnect}
                    disabled={!selectedBank}
                  >
                    <ExternalLink className="h-4 w-4" /> {t('connect_bank')}
                  </Button>
                </div>
              )}

              {step === 'connecting' && (
                <div className="py-8 text-center space-y-4">
                  <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
                  <div>
                    <p className="font-medium">{t('bank_connecting')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('bank_connecting_desc')}
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-8 text-center space-y-3"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{t('bank_connect_success')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('connection_success_desc')}
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 'error' && (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                    <X className="h-8 w-8 text-error" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{t('bank_connect_error')}</p>
                    <p className="text-sm text-muted-foreground">{errorMsg}</p>
                  </div>
                  <Button variant="outline" onClick={reset}>{t('selfie_retry')}</Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
