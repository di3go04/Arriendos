'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { parseISO, isBefore, differenceInDays, addDays, isAfter, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
}

export const PAYMENT_METHODS = [
  'Transferencia Bancaria','Nequi','Daviplata','Efectivo','Consignación','Tarjeta Débito/Crédito','PayPal','Otro'
];

export const STATUS_OPTS = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagado' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'due_soon', label: 'Vence pronto' },
  { value: 'overdue', label: 'Vencido' },
];

export function getPaymentStatus(p: any, today: Date) {
  const isOverdue = !p.paid && isBefore(parseISO(p.due_date), today);
  const days = differenceInDays(parseISO(p.due_date), today);
  const isDueSoon = !p.paid && !isOverdue && days <= 5;
  if (p.paid) return { key: 'paid', label: 'Pagado', cls: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
  if (isOverdue) return { key: 'overdue', label: `Vencido (${Math.abs(days)}d)`, cls: 'text-red-600 bg-red-500/10 border-red-500/20' };
  if (isDueSoon) return { key: 'due_soon', label: `Vence en ${days}d`, cls: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
  return { key: 'pending', label: 'Pendiente', cls: 'text-blue-600 bg-blue-500/10 border-blue-500/20' };
}

export function usePayments(user: any, profile: any) {
  const [payments, setPayments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState('all');
  const [filterContractId, setFilterContractId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const notifDone = useRef(false);
  const isLandlord = profile?.role === 'arrendador';

  const fetchData = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      if (isLandlord) {
        const { data: cts } = await supabase.from('contracts')
          .select('*, property:properties(id,title,address,city,monthly_rent), tenant:profiles!contracts_tenant_id_fkey(id,full_name,phone), landlord:profiles!contracts_landlord_id_fkey(id,full_name,phone)')
          .eq('landlord_id', user.id).order('created_at', { ascending: false });
        const ids = (cts || []).map(c => c.id);
        if (ids.length === 0) { setPayments([]); setContracts([]); setProperties([]); setLoading(false); return; }
        const { data: pays, error: e } = await supabase.from('payments').select('*').in('contract_id', ids).order('due_date', { ascending: false });
        if (e) throw e;
        setPayments((pays || []).map(p => ({ ...p, contract: (cts || []).find(c => c.id === p.contract_id) || null })).filter(p => p.contract));
        setContracts(cts || []);
      } else {
        const { data: pays, error: e } = await supabase.from('payments').select('*').eq('tenant_id', user.id).order('due_date', { ascending: false });
        if (e) throw e;
        const cids = [...new Set((pays || []).map(p => p.contract_id))];
        if (cids.length > 0) {
          const { data: cts } = await supabase.from('contracts')
            .select('*, property:properties(id,title,address,city,monthly_rent), landlord:profiles!contracts_landlord_id_fkey(id,full_name,phone), tenant:profiles!contracts_tenant_id_fkey(id,full_name,phone)')
            .in('id', cids);
          setPayments((pays || []).map(p => ({ ...p, contract: (cts || []).find(c => c.id === p.contract_id) || null })).filter(p => p.contract));
          setContracts(cts || []);
        } else { setPayments([]); setContracts([]); }
      }
      let pq = supabase.from('properties').select('id,title,city');
      if (isLandlord) pq = pq.eq('owner_id', user.id);
      const { data: props } = await pq;
      setProperties(props || []);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError('No se pudieron cargar los pagos.');
    } finally { setLoading(false); }
  }, [user, profile, isLandlord]);

  useEffect(() => { if (user && profile) fetchData(); }, [user, profile, fetchData]);

  // Auto-notifications
  useEffect(() => {
    if (!user || !profile || payments.length === 0 || notifDone.current) return;
    notifDone.current = true;
    (async () => {
      const today = new Date();
      for (const p of payments) {
        if (p.paid) continue;
        const due = parseISO(p.due_date);
        const type = isBefore(due, addDays(today, -1)) ? 'pago_vencido' : (isAfter(due, today) && isBefore(due, addDays(today, 5))) ? 'pago_proximo' : null;
        if (!type) continue;
        const { data: ex } = await supabase.from('notifications').select('id').eq('user_id', p.tenant_id).eq('contract_id', p.contract_id).eq('type', type).gte('created_at', addDays(today, -7).toISOString()).maybeSingle();
        if (!ex) {
          await supabase.from('notifications').insert({ user_id: p.tenant_id, contract_id: p.contract_id, type, title: type === 'pago_proximo' ? 'Próximo pago' : 'Pago vencido', message: `Pago de ${formatCOP(p.amount)} — ${format(due, 'dd/MMM/yyyy', { locale: es })}` });
          await supabase.functions.invoke('send-notification', { body: { type, userId: p.tenant_id, contractId: p.contract_id } }).catch(() => {});
        }
      }
    })();
  }, [payments, user, profile]);

  const today = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const q = search.toLowerCase();
      const name = p.contract?.tenant?.full_name?.toLowerCase() || p.contract?.landlord?.full_name?.toLowerCase() || '';
      const prop = p.contract?.property?.title?.toLowerCase() || '';
      const cnum = p.contract?.contract_number?.toLowerCase() || '';
      if (q && !name.includes(q) && !prop.includes(q) && !cnum.includes(q)) return false;
      if (filterPropertyId !== 'all' && p.contract?.property?.id !== filterPropertyId) return false;
      if (filterContractId !== 'all' && p.contract_id !== filterContractId) return false;
      if (filterStatus !== 'all' && getPaymentStatus(p, today).key !== filterStatus) return false;
      if (filterDateFrom) { const d = parseISO(p.due_date); if (isBefore(d, parseISO(filterDateFrom))) return false; }
      if (filterDateTo) { const d = parseISO(p.due_date); if (isAfter(d, addDays(parseISO(filterDateTo), 1))) return false; }
      return true;
    });
  }, [payments, search, filterPropertyId, filterContractId, filterStatus, filterDateFrom, filterDateTo, today]);

  const totals = useMemo(() => {
    const paid = filtered.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
    const pending = filtered.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);
    const overdue = filtered.filter(p => !p.paid && isBefore(parseISO(p.due_date), today)).reduce((s, p) => s + p.amount, 0);
    return { paid, pending, overdue, morosity: pending > 0 ? Math.round((overdue / pending) * 100) : 0 };
  }, [filtered, today]);

  const filteredContracts = filterPropertyId === 'all' ? contracts : contracts.filter(c => c.property?.id === filterPropertyId);

  return {
    payments, filtered, contracts: filteredContracts, properties, loading, error, isLandlord, today, totals, fetchData,
    search, setSearch, filterPropertyId, setFilterPropertyId, filterContractId, setFilterContractId,
    filterStatus, setFilterStatus, filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
  };
}
