'use client';

import { AlertTriangle,Check,Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ESignatureProps {
  contractId: string;
  signerRole: 'landlord' | 'tenant';
  signerName: string;
  onSigned?: () => void;
}

export function ESignature({ contractId, signerRole, signerName, onSigned }: ESignatureProps) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState('');

  const handleSign = async () => {
    if (!agreed) return;
    setSigning(true);
    setError('');

    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, signerRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al firmar');

      setSigned(true);
      onSigned?.();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Error al firmar el contrato');
    } finally {
      setSigning(false);
    }
  };

  if (signed) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
        <Check className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="font-bold text-foreground">Contrato firmado exitosamente</p>
        <p className="text-xs text-muted-foreground mt-1">Firmado por {signerName}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="w-5 h-5" />
        <h3 className="font-bold text-foreground">Firma Electrónica</h3>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Al firmar este contrato usted acepta:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Los términos y condiciones del arrendamiento</li>
          <li>El pago de la renta mensual acordada</li>
          <li>Las condiciones de uso del inmueble</li>
          <li>Que esta firma tiene validez legal</li>
        </ul>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-xs text-muted-foreground">
          He leído y acepto los términos del contrato. Entiendo que esta firma electrónica tiene validez legal y queda registrada con mi dirección IP y fecha/hora.
        </span>
      </label>

      {error && (
        <p className="text-xs text-destructive font-semibold">{error}</p>
      )}

      <button
        onClick={handleSign}
        disabled={!agreed || signing}
        className="w-full flex items-center justify-center gap-2 py-3 px-5 text-sm font-bold rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border-none"
      >
        {signing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" />
            Firmar como {signerRole === 'landlord' ? 'Arrendador' : 'Inquilino'}
          </>
        )}
      </button>
    </div>
  );
}
