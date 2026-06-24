'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Step = 'intro' | 'document' | 'selfie' | 'processing' | 'result';

interface KycResult {
  ok: boolean;
  status: string;
  confidence: number;
  faceMatchScore: number;
  error?: string;
}

export function KycWizard() {
  const [step, setStep] = useState<Step>('intro');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [result, setResult] = useState<KycResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleVerify = useCallback(async () => {
    if (!documentFile || !selfieFile) return;
    setStep('processing');
    setError(null);

    const form = new FormData();
    form.append('document', documentFile);
    form.append('selfie', selfieFile);
    form.append('documentType', 'national_id');

    try {
      const res = await fetch('/api/modules/kyc/verify', { method: 'POST', body: form });
      const data = await res.json();
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setStep('result');
    }
  }, [documentFile, selfieFile]);

  const reset = () => {
    setStep('intro');
    setDocumentFile(null);
    setSelfieFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-2 text-xl font-bold">Verificación de Identidad</h2>
      <p className="mb-6 text-sm text-zinc-500">
        Proceso seguro requerido por la circular externa 029 de 2024 (SIC). Tus datos están cifrados.
      </p>

      {step === 'intro' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Camera className="h-5 w-5 text-blue-600" />
              Verificación en 2 pasos
            </h3>
            <ol className="ml-6 list-decimal space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Sube una foto clara de tu documento de identidad</li>
              <li>Toma una selfie para verificar tu identidad</li>
              <li>El sistema compara ambos en segundos</li>
            </ol>
          </div>
          <button
            onClick={() => setStep('document')}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
          >
            Comenzar verificación
          </button>
        </div>
      )}

      {step === 'document' && (
        <div className="space-y-4">
          <h3 className="font-semibold">1. Sube tu documento de identidad</h3>
          <div
            onClick={() => docRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition hover:border-blue-400"
          >
            <Upload className="h-8 w-8 text-zinc-400" />
            <p className="text-sm text-zinc-500">
              {documentFile ? documentFile.name : 'Haz clic para seleccionar (Cédula, Pasaporte o Licencia)'}
            </p>
          </div>
          <input ref={docRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => {
            if (e.target.files?.[0]) setDocumentFile(e.target.files[0]);
          }} />
          {documentFile && (
            <button onClick={() => setStep('selfie')} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
              Siguiente: Selfie
            </button>
          )}
        </div>
      )}

      {step === 'selfie' && (
        <div className="space-y-4">
          <h3 className="font-semibold">2. Toma una selfie</h3>
          <div className="flex justify-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-blue-200 bg-zinc-100 dark:bg-zinc-800">
              {selfieFile ? (
                <img src={URL.createObjectURL(selfieFile)} alt="selfie" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  <Camera className="h-12 w-12" />
                </div>
              )}
            </div>
          </div>
          <input
            ref={selfieRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) setSelfieFile(e.target.files[0]); }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => selfieRef.current?.click()}
              className="flex-1 rounded-lg border px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {selfieFile ? 'Cambiar selfie' : 'Tomar selfie'}
            </button>
            {selfieFile && (
              <button onClick={handleVerify} className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
                Verificar identidad
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-sm text-zinc-500">Verificando tu identidad...</p>
          <p className="text-xs text-zinc-400">Esto toma solo unos segundos</p>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-4">
          {error ? (
            <div className="rounded-xl bg-red-50 p-6 text-center dark:bg-red-950/30">
              <XCircle className="mx-auto mb-2 h-12 w-12 text-red-500" />
              <h3 className="font-bold text-red-700">Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : result?.ok ? (
            <div className="rounded-xl bg-green-50 p-6 text-center dark:bg-green-950/30">
              <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
              <h3 className="font-bold text-green-700">Identidad verificada</h3>
              <div className="mt-3 space-y-1 text-sm text-green-600">
                <p>Confianza: {Math.round((result.confidence || 0) * 100)}%</p>
                <p>Coincidencia facial: {Math.round((result.faceMatchScore || 0) * 100)}%</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-red-50 p-6 text-center dark:bg-red-950/30">
              <XCircle className="mx-auto mb-2 h-12 w-12 text-red-500" />
              <h3 className="font-bold text-red-700">No se pudo verificar</h3>
              <p className="mt-2 text-sm text-red-600">{result?.error || 'Intenta de nuevo con mejor iluminación'}</p>
            </div>
          )}
          <button onClick={reset} className="w-full rounded-lg border px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
            {result?.ok ? 'Finalizar' : 'Reintentar'}
          </button>
        </div>
      )}
    </div>
  );
}
