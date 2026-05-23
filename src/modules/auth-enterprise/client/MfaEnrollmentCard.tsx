'use client';

import { Loader2, Shield } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function MfaEnrollmentCard() {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const startEnroll = async () => {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/modules/auth-enterprise/mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enroll' }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok && data.qrCode) {
      setQrCode(data.qrCode);
      setFactorId(data.factorId);
    } else {
      setMessage(data.error || 'No se pudo iniciar MFA');
    }
  };

  const verify = async () => {
    if (!factorId) return;
    setLoading(true);
    const res = await fetch('/api/modules/auth-enterprise/mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', factorId, code }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage(data.ok ? 'MFA activado correctamente' : data.error || 'Código inválido');
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm">Autenticación en dos pasos (MFA)</h3>
      </div>
      {!qrCode ? (
        <button
          type="button"
          onClick={startEnroll}
          disabled={loading}
          className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Activar MFA'}
        </button>
      ) : (
        <div className="space-y-3">
          {qrCode.startsWith('data:') || qrCode.startsWith('http') ? (
            <Image src={qrCode} alt="QR MFA" width={160} height={160} className="mx-auto" unoptimized />
          ) : (
            <p className="text-xs break-all font-mono bg-muted p-2 rounded">{qrCode}</p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código 6 dígitos"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={verify}
            disabled={loading || code.length < 6}
            className="w-full text-sm font-bold text-white bg-primary py-2 rounded-xl"
          >
            Verificar y activar
          </button>
        </div>
      )}
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
