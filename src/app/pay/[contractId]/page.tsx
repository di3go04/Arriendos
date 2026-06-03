'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, AlertTriangle, CreditCard, Building2 } from 'lucide-react';

export default function PayContractPage() {
  const { contractId } = useParams();
  const [contract, setContract] = useState<Record<string, unknown> | null>(null);
  const [property, setProperty] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [mpLink, setMpLink] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: c, error: ce } = await supabase
          .from('contracts')
          .select('*, property:properties(*)')
          .eq('id', contractId)
          .single();
        if (ce || !c) throw new Error('Contrato no encontrado');
        setContract(c);
        setProperty(c.property);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, amount: (contract as Record<string, unknown>)?.monthly_rent, description: `Pago de renta - ${(property as Record<string, unknown>)?.title || ''}` }),
      });
      const data: Record<string, unknown> = await res.json();
      const initPoint = data.init_point as string | undefined;
      if (initPoint) {
        setMpLink(initPoint);
        window.open(initPoint, '_blank');
        setPaid(true);
      } else {
        setError('Error al generar el pago');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Error</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e6edf5] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-card shadow-card p-8">
        <div className="text-center mb-8">
          <Building2 className="w-10 h-10 text-[#1e3a5f] mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground">Pago de Renta</h1>
          <p className="text-sm text-muted-foreground mt-1">RentNow · Pago seguro</p>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Propiedad</span>
            <span className="font-semibold text-foreground">{(property as Record<string, unknown>)?.title as string || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monto</span>
            <span className="font-bold text-foreground tabular-nums">
              ${Number((contract as Record<string, unknown>)?.monthly_rent || 0).toLocaleString('es-CO')} COP
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contrato</span>
            <span className="font-semibold text-foreground">#{(contract as Record<string, unknown>)?.contract_number as string || (contractId as string)?.toString().slice(0, 8)}</span>
          </div>
        </div>

        {paid ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-foreground mb-1">Pago Iniciado</h2>
            <p className="text-sm text-muted-foreground mb-4">Redirigiendo a Mercado Pago...</p>
            {mpLink && (
              <a href={mpLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Abrir Mercado Pago
              </a>
            )}
          </div>
        ) : (
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1e3a5f] hover:bg-[#152e4a] text-white font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-btn-hover"
          >
            {paying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Pagar con Mercado Pago</>
            )}
          </button>
        )}

        <div className="mt-6 text-center">
          <img src="https://www.mercadopago.com/org-img/MP3/home/logomp3.gif" alt="Mercado Pago" className="h-6 mx-auto opacity-60" />
          <p className="text-[10px] text-muted-foreground mt-2">Pago procesado por Mercado Pago · Datos protegidos</p>
        </div>
      </div>
    </div>
  );
}
