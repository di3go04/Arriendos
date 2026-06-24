'use client';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Contract,Payment,Profile,Property } from '@/types';
import { format,parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
Building2,
Calendar,
CheckCircle2,
ChevronRight,
Clock,
CreditCard,
DollarSign,
FileSignature,FileText,
Loader2,
MapPin,
Sparkles,
User
} from 'lucide-react';
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation';
import { useEffect,useState } from 'react';

interface ContractWithJoins extends Contract {
  property?: Property;
  landlord?: Profile;
}

interface PaymentWithContract extends Omit<Payment, 'contract'> {
  contract?: Contract & { property?: Property };
}

import { formatCOP } from '@/lib/format';

function statusBadge(status: string, t: ReturnType<typeof useTranslations>) {
  const map: Record<string, { label: string; cls: string }> = {
    pendiente_firma: { label: t('contracts.pending_signature'), cls: 'bg-amber-50 border-amber-200 text-amber-600' },
    activo: { label: t('contracts.active'), cls: 'bg-success/10 border-success/20 text-success' },
    firmado: { label: t('contracts.signed'), cls: 'bg-primary/10 border-primary/20 text-primary' },
    finalizado: { label: t('contracts.finished'), cls: 'bg-muted border-border text-ink-muted' },
    cancelado: { label: t('contracts.cancelled'), cls: 'bg-destructive/10 border-destructive/20 text-destructive' },
  };
  const s = map[status];
  return s ? <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span> : null;
}

export default function TenantDashboard() {
  const t = useTranslations('tenant')
  const tRoot = useTranslations()
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<ContractWithJoins[]>([]);
  const [payments, setPayments] = useState<PaymentWithContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: contractsData, error: contractsErr } = await supabase
          .from('contracts')
          .select('*, property:properties (*), landlord:profiles!contracts_landlord_id_fkey (*)')
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false });
        if (contractsErr) throw contractsErr;
        setContracts(contractsData || []);

        const { data: paymentsData, error: paymentsErr } = await supabase
          .from('payments')
          .select('*, contract:contracts!inner (property:properties (id, title, address, city))')
          .eq('tenant_id', user.id)
          .order('due_date', { ascending: false });
        if (paymentsErr) throw paymentsErr;
        setPayments(paymentsData || []);
      } catch (err) {
        console.error(err);
        toast({ type: 'error', message: t('load_error') });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-primary flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-xs">A</span>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-xs font-semibold text-ink-muted">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[20px] p-6 md:p-8 shadow-card-hover">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-light to-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <Sparkles className="w-6 h-6 text-blue-200" />
            {t('greeting', { name: profile?.full_name || t('default_name') })}
          </h2>
          <p className="text-xs text-blue-100/80 mt-1.5 font-medium max-w-xl">
            {t('hero_desc')}
          </p>
        </div>
      </div>

      {/* Pending signature alert */}
      {pendingContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <FileSignature className="w-4 h-4 text-warning" />
            {tRoot('contracts.pending_signature')}
          </h3>
          {pendingContracts.map(c => (
            <div key={c.id} className="bg-card border border-border shadow-card rounded-[16px] p-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-warning/10 border border-warning/20 text-warning">
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground">{t('pending_contract_title')}</h4>
                      <p className="text-xs text-ink-secondary mt-0.5 font-medium">
                        {c.landlord?.full_name || tRoot('tenant_page.landlord_fallback')} —{' '}
                        {c.property?.title || tRoot('tenant_page.property_fallback')}{c.property?.city ? `, ${c.property.city}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Inicia: {c.start_date ? format(parseISO(c.start_date), 'dd/MMM/yyyy', { locale: es }) : '—'}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-primary" /> {t('rent')}: <span className="tabular-nums">{formatCOP(c.monthly_rent)}</span></span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/contracts/${c.id}/sign`)}
                >
                  <FileSignature className="w-4 h-4" />
                  {t('review_sign')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats mini-row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: t('stat_active_contracts'), value: activeContracts.length, icon: FileText, iconCls: 'text-brand', bgCls: 'bg-muted border-border' },
          { label: t('stat_pending_signatures'), value: pendingContracts.length, icon: FileSignature, iconCls: 'text-warning', bgCls: 'bg-warning/10 border-warning/20' },
          { label: t('stat_payments_made'), value: payments.filter(p => p.paid).length, icon: CheckCircle2, iconCls: 'text-primary', bgCls: 'bg-primary-subtle border-primary/20' },
          { label: t('stat_upcoming_payments'), value: payments.filter(p => !p.paid).length, icon: Clock, iconCls: 'text-warning', bgCls: 'bg-warning/10 border-warning/20' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-[16px] p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
            <div className={`p-2.5 rounded-xl ${s.bgCls} ${s.iconCls} w-fit mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <span className="block text-4xl font-bold tracking-tight text-foreground tabular-nums">{s.value}</span>
            <span className="block text-[10px] font-bold text-ink-secondary uppercase tracking-wider mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Active contracts */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <FileText className="w-4 h-4 text-primary" />
          {t('active_contracts_title')}
        </h3>
        {activeContracts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card shadow-card flex items-center justify-center mb-5 mx-auto">
              <FileText className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="font-bold text-base text-foreground">{t('no_active_contracts')}</h3>
            <p className="text-xs text-ink-muted mt-1.5 font-medium">{t('no_active_contracts_desc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeContracts.map(c => {
              const nextPmt = getNextPayment(c);
              return (
                <div key={c.id} className="bg-card border border-border rounded-[16px] p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-muted border border-border text-brand shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-foreground">{c.property?.title || tRoot('tenant_page.property_fallback')}</h4>
                          {statusBadge(c.status, tRoot)}
                        </div>
                        <p className="text-xs text-ink-secondary flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.property?.address}{c.property?.city ? `, ${c.property.city}` : ''}
                        </p>
                        <p className="text-xs text-ink-secondary flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {tRoot('tenant_page.landlord_label')}: {c.landlord?.full_name || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs shrink-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-ink-secondary font-bold uppercase">{t('rent')}</span>
                        <span className="block font-extrabold text-foreground tabular-nums">{formatCOP(c.monthly_rent)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-ink-secondary font-bold uppercase">{tRoot('tenant_page.due_label')}</span>
                        <span className="block font-semibold text-foreground">{c.end_date ? format(parseISO(c.end_date), 'dd/MMM/yyyy', { locale: es }) : 'Indefinido'}</span>
                      </div>
          <div className="text-right">
            <span className="block text-[10px] text-ink-secondary font-bold uppercase">{t('next_payment')}</span>
            <span className={`block font-bold tabular-nums ${nextPmt ? 'text-warning' : 'text-success'}`}>
              {nextPmt ? format(parseISO(nextPmt.due_date), 'dd/MMM/yyyy', { locale: es }) : t('up_to_date')}
            </span>
            {nextPmt && (
              <a href={`/pay/${c.id}`} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors">
                {tRoot('tenant_page.pay_now')} ↗
              </a>
            )}
          </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/payments')}
                      >
                        {tRoot('tenant_page.view_payments')} <ChevronRight className="w-3 h-3" />
                      </Button>
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
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <CreditCard className="w-4 h-4 text-primary" />
          {t('payment_history_title')}
        </h3>
        {payments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card shadow-card flex items-center justify-center mb-5 mx-auto">
              <CreditCard className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="font-bold text-base text-foreground">{t('no_payments')}</h3>
            <p className="text-xs text-ink-muted mt-1.5 font-medium">{t('no_payments_desc')}</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[16px] overflow-hidden shadow-card">
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-muted">
                    <th className="p-4 text-[10px] font-bold text-ink-muted uppercase tracking-wider pl-5">{tRoot('payments.property')}</th>
                    <th className="p-4 text-[10px] font-bold text-ink-muted uppercase tracking-wider">{tRoot('payments.amount')}</th>
                    <th className="p-4 text-[10px] font-bold text-ink-muted uppercase tracking-wider">{tRoot('payments.due_date')}</th>
                    <th className="p-4 text-[10px] font-bold text-ink-muted uppercase tracking-wider">{tRoot('payments.status')}</th>
                    <th className="p-4 text-[10px] font-bold text-ink-muted uppercase tracking-wider">{tRoot('payments.paid_on')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {payments.slice(0, 20).map(p => (
                    <tr key={p.id} className="hover:bg-muted transition-colors text-xs">
                      <td className="p-4 pl-5 font-medium text-foreground">{p.contract?.property?.title || '—'}</td>
                      <td className="p-4 font-bold text-foreground tabular-nums">{formatCOP(p.amount)}</td>
                      <td className="p-4 text-ink-secondary">{format(parseISO(p.due_date), 'dd/MMM/yyyy', { locale: es })}</td>
                      <td className="p-4">
                        {p.paid ? (
                          <span className="inline-flex items-center gap-1 bg-primary-subtle border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> {tRoot('payments.paid')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> {tRoot('payments.pending')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-ink-secondary">
                        {p.paid_at ? format(parseISO(p.paid_at), 'dd/MMM/yyyy', { locale: es }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-border-subtle">
              {payments.slice(0, 10).map(p => (
                <div key={p.id} className="p-4 space-y-2 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{p.contract?.property?.title || '—'}</span>
                    {p.paid ? (
                      <span className="inline-flex items-center gap-1 bg-primary-subtle border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {tRoot('payments.paid')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> {tRoot('payments.pending')}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-ink-muted font-medium">{tRoot('tenant_page.table_amount')}: </span><span className="text-foreground font-bold tabular-nums">{formatCOP(p.amount)}</span></div>
                    <div><span className="text-ink-muted font-medium">{tRoot('tenant_page.due_label')}: </span><span className="text-foreground">{format(parseISO(p.due_date), 'dd/MMM/yyyy', { locale: es })}</span></div>
                    {p.paid_at && <div className="col-span-2"><span className="text-ink-muted font-medium">{tRoot('tenant_page.paid_label')}: </span><span className="text-foreground">{format(parseISO(p.paid_at), 'dd/MMM/yyyy', { locale: es })}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
