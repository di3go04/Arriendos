'use client'

import { useTranslations } from 'next-intl'
import { useState, useRef, useCallback } from 'react'
import { useVerification } from '@/hooks/useVerification'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { SelfieCapture } from '@/components/verification/SelfieCapture'
import { BankConnect } from '@/components/verification/BankConnect'
import { Shield, Building2, Camera, CheckCircle, Upload, X, Loader2, AlertTriangle, FileCheck, UserCheck, ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UploadedFile {
  name: string
  size: number
  type: string
  dataUrl: string
}

export default function VerificationPage() {
  const t = useTranslations('VERIFICATION_PAGE')
  const { verifyIdentity, kycStatus, kycConfidence, kycFaceMatch, loading, error } = useVerification()
  const { toast } = useToast()
  const [belvoLinkId, setBelvoLinkId] = useState('')
  const [documentFile, setDocumentFile] = useState<UploadedFile | null>(null)
  const [selfieFile, setSelfieFile] = useState<UploadedFile | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'rejected'>('idle')
  const [incomeVerified, setIncomeVerified] = useState(false)
  const [identityVerified, setIdentityVerified] = useState(false)
  const [showSelfieCapture, setShowSelfieCapture] = useState(false)
  const [showBankConnect, setShowBankConnect] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)

  const handleSelfieCapture = useCallback(async (dataUrl: string) => {
    const blob = await fetch(dataUrl).then(r => r.blob())
    const fileObj: UploadedFile = {
      name: `selfie_${Date.now()}.jpg`,
      size: blob.size,
      type: 'image/jpeg',
      dataUrl,
    }
    setSelfieFile(fileObj)
    toast({ type: 'success', message: t('selfie_captured') })
  }, [toast, t])

  const handleFileSelect = (file: File, type: 'document' | 'selfie') => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const fileObj = { name: file.name, size: file.size, type: file.type, dataUrl: result }
      if (type === 'document') setDocumentFile(fileObj)
      else setSelfieFile(fileObj)
    }
    reader.readAsDataURL(file)
  }

  const handleVerifyIdentity = async () => {
    if (!documentFile) {
      toast({ type: 'warning', message: t('verify_document_required') })
      return
    }

    setVerificationStatus('uploading')
    try {
      const docBlob = await fetch(documentFile.dataUrl).then(r => r.blob())
      const selfieBlob = selfieFile ? await fetch(selfieFile.dataUrl).then(r => r.blob()) : new Blob()

      setVerificationStatus('processing')
      const result = await verifyIdentity(docBlob, documentFile.name, selfieBlob, selfieFile?.name || 'selfie.jpg')

      if (result.ok) {
        setIdentityVerified(true)
        setVerificationStatus('completed')
        toast({ type: 'success', message: t('kyc_verified') })
      } else {
        setVerificationStatus('rejected')
        toast({ type: 'error', message: t('kyc_rejected') })
      }
    } catch {
      setVerificationStatus('rejected')
      toast({ type: 'error', message: t('kyc_rejected') })
    }
  }

  const handleBankConnected = useCallback(() => {
    setIncomeVerified(true)
    toast({ type: 'success', message: t('connection_success_desc') })
  }, [toast, t])

  const removeFile = (type: 'document' | 'selfie') => {
    if (type === 'document') setDocumentFile(null)
    else setSelfieFile(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('page_title')}</h1>
        <p className="text-muted-foreground">{t('page_subtitle')}</p>
      </div>

      {/* Overall status */}
      {(incomeVerified || identityVerified) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-success/30 bg-success/5 p-4"
        >
          <div className="flex items-center gap-3">
            <UserCheck className="h-6 w-6 text-success" />
            <div>
              <p className="font-semibold text-success">Progreso de verificación</p>
              <div className="flex gap-4 mt-1 text-sm">
                <span className={incomeVerified ? 'text-success' : 'text-muted-foreground'}>
                  {incomeVerified ? '✓' : '○'} Ingresos
                </span>
                <span className={identityVerified ? 'text-success' : 'text-muted-foreground'}>
                  {identityVerified ? '✓' : '○'} Identidad
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Banking */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t('open_banking_title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('open_banking_desc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!incomeVerified ? (
              <div className="space-y-3">
                <Input
                  label={t('belvo_link_label')}
                  placeholder={t('belvo_link_placeholder')}
                  value={belvoLinkId}
                  onChange={e => setBelvoLinkId(e.target.value)}
                />
                <Button onClick={() => setShowBankConnect(true)} className="w-full gap-2">
                  <Building2 className="h-4 w-4" /> {t('connect_bank')}
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <CheckCircle className="mx-auto h-12 w-12 text-success mb-3" />
                <p className="font-medium text-foreground">{t('connection_success')}</p>
                <p className="text-sm text-muted-foreground">{t('connection_success_desc')}</p>
              </motion.div>
            )}

            {error && (
              <div className="rounded-lg bg-error/5 border border-error/20 p-3 text-sm text-error">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {t('kyc_title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('kyc_desc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document upload */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Documento de identidad</p>
              {documentFile ? (
                <div className="rounded-xl border border-success/30 bg-success/5 p-3 flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{documentFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(documentFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => removeFile('document')} className="rounded-lg p-1 hover:bg-muted transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => docInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-sm font-medium text-foreground">{t('upload_document')}</p>
                  <p className="text-xs text-muted-foreground">{t('upload_document_formats')}</p>
                  <input
                    ref={docInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'document')}
                  />
                </div>
              )}
            </div>

            {/* Selfie capture */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Selfie / Foto facial</p>
              {selfieFile ? (
                <div className="rounded-xl border border-success/30 bg-success/5 p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <ImageIcon className="h-5 w-5 text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Selfie capturada</p>
                      <p className="text-xs text-muted-foreground">{(selfieFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => removeFile('selfie')} className="rounded-lg p-1 hover:bg-muted transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <img
                    src={selfieFile.dataUrl}
                    alt="Selfie preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowSelfieCapture(true)}
                  className="w-full rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Camera className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-sm font-medium text-foreground">{t('take_selfie')}</p>
                  <p className="text-xs text-muted-foreground">{t('take_selfie_hint')}</p>
                </button>
              )}
            </div>

            <Button
              onClick={handleVerifyIdentity}
              className="w-full gap-2"
              loading={verificationStatus === 'uploading' || verificationStatus === 'processing'}
              disabled={!documentFile || identityVerified}
            >
              {verificationStatus === 'processing' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
              ) : identityVerified ? (
                <><CheckCircle className="h-4 w-4" /> Verificada</>
              ) : (
                <><Shield className="h-4 w-4" /> {t('verify_identity')}</>
              )}
            </Button>

            {/* Status badges */}
            <AnimatePresence>
              {verificationStatus === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-success/30 bg-success/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    <p className="text-sm font-medium text-success">Identidad verificada exitosamente</p>
                  </div>
                </motion.div>
              )}

              {verificationStatus === 'rejected' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-error/30 bg-error/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-error shrink-0" />
                    <p className="text-sm font-medium text-error">No se pudo verificar la identidad. Intenta de nuevo.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {kycStatus && verificationStatus === 'idle' && (
              <div className={`rounded-lg border p-3 text-sm ${
                kycStatus === 'VERIFIED' ? 'border-success/30 bg-success/5 text-success' :
                kycStatus === 'REJECTED' ? 'border-error/30 bg-error/5 text-error' :
                'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                {kycStatus === 'VERIFIED' && t('kyc_verified')}
                {kycStatus === 'REJECTED' && t('kyc_rejected')}
                {kycStatus === 'PENDING' && t('kyc_pending')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <SelfieCapture
        open={showSelfieCapture}
        onClose={() => setShowSelfieCapture(false)}
        onCapture={handleSelfieCapture}
      />
      <BankConnect
        open={showBankConnect}
        onClose={() => setShowBankConnect(false)}
        onConnected={handleBankConnected}
      />
    </div>
  )
}
