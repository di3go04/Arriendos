'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface PaymentRecord {
  id: string;
  property_name: string;
  tenant_name: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Failed';
  invoice_url?: string | null;
}

const FALLBACK_PAYMENTS: PaymentRecord[] = [
  { id: 'fb-1', tenant_name: 'Carlos López', property_name: 'Edif. Mediterráneo', amount: 1500000, date: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'Paid' },
  { id: 'fb-2', tenant_name: 'María García', property_name: 'Casa Laureles', amount: 3200000, date: new Date(Date.now() - 7 * 86400000).toISOString(), status: 'Pending' },
  { id: 'fb-3', tenant_name: 'Andrés Medina', property_name: 'Coliving Poblado', amount: 1200000, date: new Date(Date.now() - 30 * 86400000).toISOString(), status: 'Overdue' },
  { id: 'fb-4', tenant_name: 'Laura Pérez', property_name: 'Apartamento 1401', amount: 4800000, date: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'Paid' },
  { id: 'fb-5', tenant_name: 'Pedro Ramírez', property_name: 'Local Centro', amount: 2500000, date: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'Pending' },
  { id: 'fb-6', tenant_name: 'Roberto Vega', property_name: 'Casa Sur', amount: 2200000, date: new Date(Date.now() - 45 * 86400000).toISOString(), status: 'Overdue' },
  { id: 'fb-7', tenant_name: 'Ana Torres', property_name: 'Estudio Centro', amount: 950000, date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'Failed' },
  { id: 'fb-8', tenant_name: 'Sofía Herrera', property_name: 'Oficina Norte', amount: 1800000, date: new Date(Date.now() - 10 * 86400000).toISOString(), status: 'Pending' },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

export function usePayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPayments() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setPayments(FALLBACK_PAYMENTS);
          setIsLoading(false);
          return;
        }

        const { data, error: fetchErr } = await supabase
          .from('payments')
          .select('id, property_name, tenant_name, amount, date, status, invoice_url')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (fetchErr) throw fetchErr;

        if (!cancelled) {
          setPayments(data ?? []);
        }
      } catch (e) {
        console.error('[usePayments] Error fetching payments:', e);
        if (!cancelled) {
          setError('No se pudieron cargar los pagos');
          setPayments(FALLBACK_PAYMENTS);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPayments();
    return () => { cancelled = true; };
  }, []);

  return { payments, isLoading, error };
}
