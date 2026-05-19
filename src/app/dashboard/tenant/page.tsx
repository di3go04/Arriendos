'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Contract, Payment, Property, Profile } from '@/types';
import {
  FileSignature, FileText, Building2, DollarSign, Calendar,
  CheckCircle2, AlertTriangle, ArrowRight, Loader2, Clock,
  MapPin, User, ChevronRight, Home, CreditCard, Sparkles,
  Ban, CircleCheckBig, Receipt, XCircle, TrendingUp
} from 'lucide-react';
import { format, parseISO, addMonths, getDaysInMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContractWithJoins extends Contract {
  property?: Property;
  landlord?: Profile;
}

interface PaymentWithContract extends Omit<Payment, 'contract'> {
  contract?: Contract & { property?: Property };
}


function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    pendiente_firma: { label: 'Pendiente de Firma', cls: 'bg-amber-500/15 border-amber-500/25 text-amber-500' },
    activo: { label: 'Activo', cls: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-500' },
    firmado: { label: 'Firmado', cls: 'bg-blue-500/15 border-blue-500/25 text-blue-500' },
    finalizado: { label: 'Finalizado', cls: 'bg-muted border-border text-muted-foreground' },
    cancelado: { label: 'Cancelado', cls: 'bg-rose-500/15 border-rose-500/25 text-rose-500' },
  };
  const s = map[status];
  return s ? <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span> : null;
}

export default function TenantDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<ContractWithJoins[]>([]);
  const [payments, setPayments] = useState<PaymentWithContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Tenant Page] useEffect triggered. user is:', user?.id);
    if (!user) return;
    const fetchData = async () => {
      console.log('[Tenant Page] Starting fetchData...');
      setLoading(true);
      try {
        // Fetch contracts where I'm the tenant
        console.log('[Tenant Page] fetching contracts for tenant', user.id);
        const { data: contractsData, error: contractsErr } = await supabase
          .from('contracts')
          .select(`
            *,
            property:properties (*),
            landlord:profiles!contracts_landlord_id_fkey (*)
          `)
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false });
        if (contractsErr) throw contractsErr;
        console.log('[Tenant Page] contracts fetched:', contractsData?.length);
        setContracts(contractsData || []);

        // Fetch my payments
        console.log('[Tenant Page] fetching payments for tenant', user.id);
        const { data: paymentsData, error: paymentsErr } = await supabase
          .from('payments')
          .select(`
            *,
            contract:contracts!inner (
              property:properties (id, title, address, city)
            )
          `)
          .eq('tenant_id', user.id)
          .order('due_date', { ascending: false });
        if (paymentsErr) throw paymentsErr;
        console.log('[Tenant Page] payments fetched:', paymentsData?.length);
        setPayments(paymentsData || []);
      } catch (err) {
        console.error('[Tenant Page] Error fetching tenant data:', err);
        toast({ type: 'error', message: 'Error al cargar datos del inquilino.' });
      } finally {
        console.log('[Tenant Page] Setting loading to false');
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const pendingContracts = contracts.filter(
    c => c.status === 'pendiente_firma' && !c.signed_by_tenant
  );
  const activeContracts = contracts.filter(
    c => c.status === 'activo' || c.status === 'firmado'
  );

  const getNextPayment = (contract: Contract) => {
    const upcoming = payments
      .filter(p => p.contract_id === contract.id && !p.paid)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return upcoming[0] || null;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Cargando tu panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Hero */}
      <div className="bg-card border-none shadow-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Home className="w-6 h-6 text-primary" />
            ¡Hola, {profile?.full_name || 'Inquilino'}!
          </h2>
          <p className="text-xs text-ink-muted mt-1.5 font-medium max-w-xl">
            Aquí puedes revisar tus contratos, realizar pagos y gestionar tu perfil como arrendatario.
          </p>
        </div>
      </div>

      {/* Pending signature alert */}
      {pendingContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-warning" />
            Contratos pendientes de firma
          </h3>
          {pendingContracts.map(c => (
            <div key={c.id} className="bg-card border-none shadow-card rounded-3xl p-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-warning/10 border-none text-warning">
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-foreground">Tienes un contrato pendiente de firma</h4>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {c.landlord?.full_name || 'El arrendador'} —{' '}
                        {c.property?.title || 'Propiedad'}{c.property?.city ? `, ${c.property.city}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Inicia: {c.start_date ? format(parseISO(c.start_date), 'dd/MMM/yyyy', { locale: es }) : '—'}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-success" /> Renta: <span className="tabular-nums">{formatCOP(c.monthly_rent)}</span></span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/contracts/${c.id}/sign`)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow-btn hover:shadow-card-hover transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <FileSignature className="w-4 h-4" />
                  Revisar y firmar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats mini-row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Contratos Activos', value: activeContracts.length, icon: FileText, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Pendientes de Firma', value: pendingContracts.length, icon: FileSignature, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Pagos Realizados', value: payments.filter(p => p.paid).length, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Próximos Pagos', value: payments.filter(p => !p.paid).length, icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((s, i) => (
          <div key={i} className="bg-card border-none rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className={`p-2.5 rounded-xl ${s.bg} ${s.color} w-fit mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <span className="block text-3xl font-extrabold text-foreground tabular-nums">{s.value}</span>
            <span className="block text-[10px] font-bold text-ink-secondary uppercase tracking-wider mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Active contracts */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Mis Contratos Activos
        </h3>
        {activeContracts.length === 0 ? (
          <div className="py-24 text-center bg-muted/30 border border-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-card shadow-card flex items-center justify-center mb-5">
              <FileText className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="font-bold text-base text-foreground">No tienes contratos activos</h3>
            <p className="text-xs text-ink-muted mt-1.5 font-medium">No se encontraron contratos en estado activo o firmado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeContracts.map(c => {
              const nextPmt = getNextPayment(c);
              return (
                <div key={c.id} className="bg-card border-none rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-primary/10 border-none text-primary shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-extrabold text-sm text-foreground">{c.property?.title || 'Propiedad'}</h4>
                          {statusBadge(c.status)}
                        </div>
                        <p className="text-xs text-ink-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.property?.address}{c.property?.city ? `, ${c.property.city}` : ''}
                        </p>
                        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          Arrendador: {c.landlord?.full_name || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs shrink-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-ink-secondary font-bold uppercase">Renta</span>
                        <span className="block font-extrabold text-foreground tabular-nums">{formatCOP(c.monthly_rent)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-ink-secondary font-bold uppercase">Vence</span>
                        <span className="block font-semibold text-foreground">{c.end_date ? format(parseISO(c.end_date), 'dd/MMM/yyyy', { locale: es }) : 'Indefinido'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-ink-secondary font-bold uppercase">Próximo pago</span>
                        <span className={`block font-bold tabular-nums ${nextPmt ? 'text-warning' : 'text-success'}`}>
                          {nextPmt ? format(parseISO(nextPmt.due_date), 'dd/MMM/yyyy', { locale: es }) : 'Al día'}
                        </span>
                      </div>
                      <button
                        onClick={() => router.push('/dashboard/payments')}
                        className="flex items-center gap-1 px-4 py-2 bg-muted border border-transparent rounded-lg text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-btn transition-all cursor-pointer"
                      >
                        Ver pagos <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-500" />
          Historial de Pagos
        </h3>
        {payments.length === 0 ? (
          <div className="py-24 text-center bg-muted/30 border border-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-card shadow-card flex items-center justify-center mb-5">
              <CreditCard className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="font-bold text-base text-foreground">No hay pagos registrados</h3>
            <p className="text-xs text-ink-muted mt-1.5 font-medium">Aún no se ha generado ningún registro de pago asociado a tus contratos.</p>
          </div>
        ) : (
          <div className="bg-card border-none rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-4 text-[10px] font-bold text-ink-secondary uppercase tracking-wider pl-5">Propiedad</th>
                    <th className="p-4 text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Monto</th>
                    <th className="p-4 text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Vencimiento</th>
                    <th className="p-4 text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Pagado el</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.slice(0, 20).map(p => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors text-xs">
                      <td className="p-4 pl-5 font-medium text-foreground">{p.contract?.property?.title || '—'}</td>
                      <td className="p-4 font-bold text-foreground tabular-nums">{formatCOP(p.amount)}</td>
                      <td className="p-3 text-muted-foreground">{format(parseISO(p.due_date), 'dd/MMM/yyyy', { locale: es })}</td>
                      <td className="p-3">
                        {p.paid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {p.paid_at ? format(parseISO(p.paid_at), 'dd/MMM/yyyy', { locale: es }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
