'use client';

import { useTranslations } from 'next-intl';
import { InteractiveOnboarding } from '@/components/onboarding/InteractiveOnboarding';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { formatCOP } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Contract,Property } from '@/types';
import {
ArrowUpRight,
BarChart3,
BrainCircuit,
Building2,
Calendar,
CheckCircle,
ClipboardList,
DollarSign,
FileSpreadsheet,
FileText,
Loader2,
Mail,
MessageSquare,
Phone,
Plus,
ShieldAlert,
Sparkles,
TrendingUp,
UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis } from 'recharts';

function StatusBadge({ status }: { status: string }) {
  const tc = useTranslations('contracts')
  const styles: Record<string, string> = {
    activo: 'bg-success/10 border-success/20 text-success',
    firmado: 'bg-primary/10 border-primary/20 text-primary',
    borrador: 'bg-warning/10 border-warning/20 text-warning',
    pendiente_firma: 'bg-primary/10 border-primary/20 text-primary',
    finalizado: 'bg-muted border-border text-muted-foreground',
    cancelado: 'bg-destructive/10 border-destructive/20 text-destructive',
  };
  const labels: Record<string, string> = {
    activo: tc('status_active'), firmado: tc('status_signed'), borrador: tc('status_draft'),
    pendiente_firma: tc('status_pending'), finalizado: tc('status_completed'), cancelado: tc('status_cancelled'),
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || 'bg-muted border-border text-muted-foreground'}`}>
      {labels[status] || status.toUpperCase()}
    </span>
  );
}

export default function LandlordDashboard() {
  const t = useTranslations('landlord')
  const td = useTranslations('dashboard')
  const te = useTranslations('errors')
  const tc = useTranslations('contracts')
  const tp = useTranslations('properties')
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalProperties: 0, activeContracts: 0, monthlyRevenue: 0, upcomingThisWeek: 0,
  });

  const [leads, setLeads] = useState<LooseRecord[]>([]);
  const [riskScores, setRiskScores] = useState<LooseRecord[]>([]);

  const [chartData, setChartData] = useState<LooseRecord[]>([]);

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: propsData } = await supabase.from('properties').select('*').eq('owner_id', user.id);
        const ownedProperties = propsData || [];
        setProperties(ownedProperties);

        const { data: contractsData } = await supabase
          .from('contracts')
          .select('*, property:properties (*), tenant:profiles!contracts_tenant_id_fkey (*)')
          .eq('landlord_id', user.id)
          .order('created_at', { ascending: false });
        const landlordContracts = contractsData || [];
        setContracts(landlordContracts);

        let landlordPayments: LooseRecord[] = [];
        const contractIds = landlordContracts.map((c: LooseValue) => c.id);
        if (contractIds.length > 0) {
          const { data: pmtsData } = await supabase
            .from('payments')
            .select('*, contract:contracts (id, contract_number, property:properties (id, title))')
            .in('contract_id', contractIds);
          landlordPayments = pmtsData || [];
        }
        const activeLeases = landlordContracts.filter((c: LooseValue) => c.status === 'activo' || c.status === 'firmado');
        const totalRentExpected = activeLeases.reduce((sum: number, c: LooseValue) => sum + Number(c.monthly_rent || 0), 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);

        const upcomingPayments = landlordPayments.filter((p: LooseValue) => {
          if (p.paid) return false;
          const dueDate = new Date(p.due_date);
          return dueDate >= today && dueDate <= sevenDaysLater;
        });

        setStats({
          totalProperties: ownedProperties.length,
          activeContracts: activeLeases.length,
          monthlyRevenue: totalRentExpected,
          upcomingThisWeek: upcomingPayments.length,
        });

        const last6Months: { key: string; name: string; Cobrado: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthName = d.toLocaleString('es-ES', { month: 'short' });
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          last6Months.push({ key, name: monthName.charAt(0).toUpperCase() + monthName.slice(1), Cobrado: 0 });
        }

        landlordPayments.forEach((p: LooseValue) => {
          if (p.paid) {
            const dateVal = new Date(p.paid_at || p.due_date || p.created_at);
            const key = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}`;
            const found = last6Months.find(m => m.key === key);
            if (found) found.Cobrado += Number(p.amount || 0);
          }
        });

        setChartData(last6Months);

        // Fetch leads y risk scores
        try {
          const res = await fetch('/api/dashboard/summary');
          if (res.ok) {
            const data = await res.json();
            setLeads(data.leads || []);
            setRiskScores(data.riskScores || []);
          }
        } catch {}
      } catch (err) {
        console.error(err);
        toast({ type: 'error', message: te('load_panel') });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-primary flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-xs">A</span>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">{t('loading_panel')}</p>
      </div>
    );
  }

  const recentContracts = contracts.slice(0, 5);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header hero */}
      <div className="relative overflow-hidden rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-card-hover">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-light to-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <Sparkles className="w-6 h-6 text-blue-200" />
            {t('greeting', { name: profile?.full_name || t('owner_fallback') })}
          </h2>
          <p className="text-xs text-blue-100/80 mt-1.5 font-medium max-w-xl">
            {t('dashboard_subtitle')}
          </p>
        </div>
        <Link href="/contracts/new" className="relative z-10">
          <Button variant="secondary" size="lg">
            <Plus className="w-4 h-4" />
            {tc('new')}
          </Button>
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border rounded-[16px] p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-muted border border-border text-brand">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">+0</span>
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">{t('properties_label')}</span>
          <span className="block text-4xl font-bold tracking-tight text-foreground mt-1 tabular-nums">{stats.totalProperties}</span>
          <Link href="/dashboard/properties" className="block text-[10px] text-primary hover:text-primary-hover font-medium mt-2 transition-colors">{t('view_catalog')}</Link>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-muted border border-border text-brand">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {t('active')}
            </span>
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">{t('contracts_label')}</span>
          <span className="block text-4xl font-bold tracking-tight text-foreground mt-1 tabular-nums">{stats.activeContracts}</span>
          <span className="block text-[10px] text-ink-secondary mt-2 font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-success" /> {t('stable')}
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-muted border border-border text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">{t('expected_rent')}</span>
          <span className="block text-4xl font-bold tracking-tight text-foreground mt-1 truncate tabular-nums">{formatCOP(stats.monthlyRevenue)}</span>
          <span className="block text-[10px] text-muted-foreground mt-2 font-semibold">{t('current_month')}</span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-muted border border-border text-warning">
              <Calendar className="w-5 h-5" />
            </div>
            {stats.upcomingThisWeek > 0 && (
              <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full animate-pulse tabular-nums">
                {t('pending_count', { count: stats.upcomingThisWeek })}
              </span>
            )}
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">{t('maturities')}</span>
          <span className="block text-4xl font-bold tracking-tight text-foreground mt-1 tabular-nums">{stats.upcomingThisWeek}</span>
          <Link href="/dashboard/payments" className="block text-[10px] text-primary hover:text-primary-hover font-medium mt-2 transition-colors">{t('go_to_reconciliation')}</Link>
        </div>
      </div>

      {/* Chart + Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('rent_flow')}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t('last_6_months')}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/reports/export-excel?type=payments"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {t('excel_export')}
              </a>
              <span className="px-3 py-1.5 rounded-lg bg-primary-subtle border border-primary/20 text-primary flex items-center gap-1.5 text-[11px] font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> {t('collected')}
              </span>
            </div>
          </div>
          <div className="w-full min-h-[200px]">
            {mounted && (
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip cursor={{ fill: 'rgba(37,99,235,0.04)' }}
                    contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(value: LooseValue) => [formatCOP(Number(value)), t('collected')]} />
                  <Bar dataKey="Cobrado" fill="url(#barG)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3.5 mb-5">
              <ClipboardList className="w-5 h-5 text-brand" />
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('operational_summary')}</h3>
            </div>
            <div className="mb-5 p-4 rounded-xl bg-muted border border-border-subtle">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-muted-foreground font-semibold">{t('occupancy')}</span>
                <span className="text-sm font-extrabold text-primary tabular-nums">
                  {properties.length > 0 ? Math.round((properties.filter(p => p.status === 'ocupado').length / properties.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: properties.length > 0 ? `${(properties.filter(p => p.status === 'ocupado').length / properties.length) * 100}%` : '0%' }} />
              </div>
            </div>
            <div className="space-y-3">
              {[{ label: tp('status_available'), value: properties.filter(p => p.status === 'disponible').length, cls: 'text-foreground' },
                { label: t('drafts'), value: contracts.filter(c => c.status === 'borrador').length, cls: 'text-warning' },
                { label: t('total_rent'), value: formatCOP(contracts.filter(c => c.status === 'activo' || c.status === 'firmado').reduce((s, c) => s + Number(c.monthly_rent || 0), 0)), cls: 'text-foreground' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted">
                  <span className="text-xs text-muted-foreground font-semibold">{item.label}</span>
                  <span className={`text-xs font-bold tabular-nums ${item.cls}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-border-subtle text-[10px] text-muted-foreground font-medium text-center">{t('live_data')}</div>
        </div>
      </div>

      {/* Sección: Leads Recientes + Riesgo IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Leads Recientes */}
        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('leads_recent_section')}</h3>
            </div>
              <Link href="/propiedades" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                {t('view_portal')} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {leads.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="p-4 rounded-2xl bg-muted inline-flex text-muted-foreground">
                <MessageSquare className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-foreground">{td('no_leads')}</p>
              <p className="text-[10px] text-muted-foreground max-w-[240px] mx-auto">{t('no_leads_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead, i) => (
                <div key={lead.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {lead.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground truncate">{lead.name}</p>
                      <span className="text-[8px] text-muted-foreground font-medium">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <a href={`mailto:${lead.email}`} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </a>
                      )}
                    </div>
                    {lead.message && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 italic">{lead.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riesgo IA - Predicción de Morosidad */}
        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('risk_prediction_section')}</h3>
            </div>
              <Link href="/dashboard/payments" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                {t('view_all')} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {riskScores.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="p-4 rounded-2xl bg-muted inline-flex text-muted-foreground">
                <BarChart3 className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-foreground">{t('no_tenant_data')}</p>
              <p className="text-[10px] text-muted-foreground max-w-[240px] mx-auto">{t('no_risk_data_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {riskScores.map((r: LooseValue, i: number) => {
                const riskColor = r.risk === 'low' ? 'text-success bg-success/10 border-success/20' :
                  r.risk === 'medium' ? 'text-warning bg-warning/10 border-warning/20' :
                  r.risk === 'high' ? 'text-orange-500 bg-orange-50 border-orange-200' :
                  'text-destructive bg-destructive/10 border-destructive/20';
                const riskLabel = r.risk === 'low' ? td('risk_low') : r.risk === 'medium' ? td('risk_medium') : r.risk === 'high' ? td('risk_high') : td('risk_critical');
                return (
                  <div key={r.tenantId || i} className="p-4 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-foreground">{r.tenantName}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${riskColor}`}>{riskLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          r.risk === 'low' ? 'bg-success' : r.risk === 'medium' ? 'bg-warning' :
                          r.risk === 'high' ? 'bg-orange-500' : 'bg-destructive'
                        }`} style={{ width: `${Math.min(r.score, 100)}%` }} />
                      </div>
                      <span className="text-xs font-black tabular-nums text-foreground">{r.score}/100</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{t('payment_summary', { count: r.paymentCount, unpaid: r.unpaidCount })}</span>
                      <ShieldAlert className={`w-3.5 h-3.5 ${r.risk === 'high' || r.risk === 'critical' ? 'text-destructive' : 'text-muted-foreground'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Contratos recientes */}
      <div className="bg-card border border-border rounded-[16px] shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-subtle p-6">
          <div>
            <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('recent_contracts')}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('most_recent')}</p>
          </div>
          <Link href="/dashboard/leases" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
            {t('view_all')} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-muted">
                {[tc('contract_number'), tc('property'), t('tenant_label'), t('status_label'), tc('monthly_rent'), tc('start_date')].map(h => (
                  <th key={h} className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider first:pl-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {recentContracts.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-xs text-muted-foreground font-medium bg-muted">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    {t('no_contracts_yet')}
                  </div>
                </td></tr>
              ) : (
                recentContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted transition-colors text-xs">
                    <td className="p-4 font-bold text-foreground pl-6 select-all">{c.contract_number}</td>
                    <td className="p-4 font-medium text-foreground">{c.property?.title || t('property_fallback')}</td>
                    <td className="p-4 font-semibold text-ink-secondary">{c.tenant?.full_name || t('unassigned')}</td>
                    <td className="p-4"><StatusBadge status={c.status} /></td>
                    <td className="p-4 font-bold text-foreground tabular-nums">{formatCOP(c.monthly_rent)}</td>
                    <td className="p-4 text-ink-secondary">{new Date(c.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border-subtle">
          {recentContracts.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-medium">{t('no_contracts_yet')}</div>
          ) : (
            recentContracts.map((c) => (
              <div key={c.id} className="p-4 space-y-2.5 hover:bg-muted transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground select-all">{c.contract_number}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground font-medium">{t('property_field')}: </span><span className="text-foreground font-semibold">{c.property?.title || t('property_fallback')}</span></div>
                  <div><span className="text-muted-foreground font-medium">{t('tenant_field')}: </span><span className="text-foreground font-semibold">{c.tenant?.full_name || t('unassigned')}</span></div>
                  <div><span className="text-muted-foreground font-medium">{t('rent_field')}: </span><span className="text-foreground font-bold">{formatCOP(c.monthly_rent)}</span></div>
                  <div><span className="text-muted-foreground font-medium">{t('start_field')}: </span><span className="text-foreground">{new Date(c.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <Link href="/contracts/new" className="fixed bottom-6 right-6 z-40">
        <Button variant="primary" size="lg" className="rounded-full p-4 shadow-btn shadow-primary/20">
          <Plus className="w-5 h-5" />
        </Button>
      </Link>

      {/* Onboarding Interactivo */}
      <InteractiveOnboarding
        steps={[
          {
            target: '',
            title: td('welcome'),
            content: t('welcome_onboarding_desc'),
          },
          {
            target: '',
            title: td('leads_recent'),
            content: t('leads_onboarding_desc'),
          },
          {
            target: '',
            title: td('risk_prediction'),
            content: t('risk_onboarding_desc'),
          },
          {
            target: '',
            title: t('export_onboarding_title'),
            content: t('export_onboarding_desc'),
          },
          {
            target: '',
            title: t('ready_onboarding_title'),
            content: t('ready_onboarding_desc'),
          },
        ]}
        storageKey="rentnow_landlord_onboarding"
      />
    </div>
  );
}
