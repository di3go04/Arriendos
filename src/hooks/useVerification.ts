import { useState, useCallback } from 'react'

interface IncomeData {
  monthlyIncome: number
  incomeCurrency: string
  employment: string
  verified: boolean
}

interface VerificationHook {
  verifyIncome: () => Promise<void>
  verifyIdentity: (documentBlob: Blob, documentName: string, selfieBlob: Blob, selfieName: string) => Promise<{ ok: boolean; status: string }>
  uploadSelfie: (selfieBlob: Blob) => Promise<string | null>
  incomeData: IncomeData | null
  kycStatus: string | null
  kycConfidence: number
  kycFaceMatch: number
  loading: boolean
  error: string | null
}

export function useVerification(): VerificationHook {
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null)
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [kycConfidence, setKycConfidence] = useState(0)
  const [kycFaceMatch, setKycFaceMatch] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyIncome = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/belvo/verify-income', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setIncomeData(data.data)
      } else {
        setError(data.error || 'Error al verificar ingresos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyIdentity = useCallback(async (
    documentBlob: Blob,
    documentName: string,
    selfieBlob: Blob,
    selfieName: string,
  ): Promise<{ ok: boolean; status: string }> => {
    setLoading(true)
    setError(null)
    try {
      setKycStatus('PENDING')

      const formData = new FormData()
      formData.append('document', documentBlob, documentName)
      formData.append('selfie', selfieBlob, selfieName)

      const res = await fetch('/api/modules/kyc/verify', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.ok) {
        setKycStatus('VERIFIED')
        setKycConfidence(data.confidence || data.data?.confidence || 0)
        setKycFaceMatch(data.faceMatchScore || data.data?.faceMatchScore || 0)
        return { ok: true, status: 'VERIFIED' }
      } else {
        setKycStatus('REJECTED')
        setError(data.error || 'Error en verificación de identidad')
        return { ok: false, status: 'REJECTED' }
      }
    } catch (err) {
      setKycStatus('REJECTED')
      setError(err instanceof Error ? err.message : 'Error en verificación')
      return { ok: false, status: 'REJECTED' }
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadSelfie = useCallback(async (selfieBlob: Blob): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('selfie', selfieBlob, `selfie_${Date.now()}.jpg`)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.url) {
        return data.url
      }
      throw new Error(data.error || 'Error al subir selfie')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    verifyIncome,
    verifyIdentity,
    uploadSelfie,
    incomeData,
    kycStatus,
    kycConfidence,
    kycFaceMatch,
    loading,
    error,
  }
}
