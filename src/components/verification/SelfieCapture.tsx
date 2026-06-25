'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Webcam from 'react-webcam'
import { Camera, X, RotateCcw, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface SelfieCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (dataUrl: string) => void
}

export function SelfieCapture({ open, onClose, onCapture }: SelfieCaptureProps) {
  const t = useTranslations('VERIFICATION_PAGE')
  const webcamRef = useRef<Webcam>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setError(null)
    }
  }, [webcamRef])

  const retake = useCallback(() => {
    setCapturedImage(null)
    setError(null)
  }, [])

  const confirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage)
      setCapturedImage(null)
      onClose()
    }
  }, [capturedImage, onCapture, onClose])

  const handleUserMediaError = useCallback(() => {
    setError('No se pudo acceder a la cámara. Verifica los permisos.')
  }, [])

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                {t('take_selfie')}
              </h3>
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              {error ? (
                <div className="rounded-xl bg-error/5 border border-error/20 p-6 text-center space-y-3">
                  <Camera className="mx-auto h-10 w-10 text-error" />
                  <p className="text-sm text-error font-medium">{t('selfie_camera_error')}</p>
                  <Button variant="outline" size="sm" onClick={() => setError(null)}>
                    {t('selfie_retry')}
                  </Button>
                </div>
              ) : capturedImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-muted">
                    <img
                      src={capturedImage}
                      alt="Selfie preview"
                      className="w-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={retake}>
                      <RotateCcw className="h-4 w-4" /> {t('selfie_retake')}
                    </Button>
                    <Button className="flex-1 gap-2" onClick={confirm}>
                      <Check className="h-4 w-4" /> {t('selfie_use_photo')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-muted aspect-[3/4]">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        facingMode,
                        width: 720,
                        height: 960,
                      }}
                      onUserMediaError={handleUserMediaError}
                      className="w-full h-full object-cover"
                      mirrored={facingMode === 'user'}
                    />
                    <div className="absolute inset-0 border-[3px] border-primary/40 rounded-xl pointer-events-none" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-primary/30 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={toggleCamera}>
                      <RotateCcw className="h-4 w-4" /> {t('selfie_switch_camera')}
                    </Button>
                    <Button className="flex-1 gap-2" onClick={capture}>
                      <Camera className="h-4 w-4" /> {t('selfie_take_photo')}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {t('take_selfie_hint')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
