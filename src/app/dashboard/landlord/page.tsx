'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property, Contract, Payment } from '@/types';
import {
  Building2,
  FileText,
  DollarSign,
  Calendar,
  Plus,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  CheckCircle,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    activo: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    firmado: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    borrador: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    pendiente_firma: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    finalizado: 'bg-muted border-border text-muted-foreground',
    cancelado: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
  };
  const labels: Record<string, string> = {
    activo: 'Activo',
    firmado: 'Firmado',
    borrador: 'Borrador',
    pendiente_firma: 'Pendiente',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || 'bg-muted border-border text-muted-foreground'}`}>
      {labels[status] || status.toUpperCase()}
    </span>
  );
}

export default function LandlordDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // States for stats
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    upcomingThisWeek: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch landlord's properties
        const { data: propsData, error: propsErr } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id);

        if (propsErr) throw propsErr;
        const ownedProperties = propsData || [];
        setProperties(ownedProperties);

        // 2. Fetch contracts
        const { data: contractsData, error: contractsErr } = await supabase
          .from('contracts')
          .select(`
            *,
            property:properties (*),
            tenant:profiles!contracts_tenant_id_fkey (*)
          `)
          .eq('landlord_id', user.id)
          .order('created_at', { ascending: false });

        if (contractsErr) throw contractsErr;
        const landlordContracts = contractsData || [];
        setContracts(landlordContracts);

        // 3. Fetch payments belonging to landlord's contracts
        let landlordPayments: any[] = [];
        const contractIds = landlordContracts.map(c => c.id);
        
        if (contractIds.length > 0) {
          const { data: pmtsData, error: pmtsErr } = await supabase
            .from('payments')
            .select(`
              *,
              contract:contracts (
                id,
                contract_number,
                property:properties (id, title)
              )
            `)
            .in('contract_id', contractIds);

          if (pmtsErr) throw pmtsErr;
          landlordPayments = pmtsData || [];
        }
        setPayments(landlordPayments);

        // 4. Calculate Stats
        const activeLeases = landlordContracts.filter(c => c.status === 'activo' || c.status === 'firmado');
        const totalRentExpected = activeLeases.reduce((sum, c) => sum + Number(c.monthly_rent || 0), 0);

        // Calculate upcoming payments this week (pending, due in next 7 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);
        sevenDaysLater.setHours(23, 59, 59, 999);

        const upcomingPayments = landlordPayments.filter(p => {
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

        // 5. Aggregate chart data (last 6 months cashflow)
        const last6Months: { key: string; name: string; Cobrado: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthName = d.toLocaleString('es-ES', { month: 'short' });
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          last6Months.push({
            key,
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            Cobrado: 0,
          });
        }

        landlordPayments.forEach(p => {
          if (p.paid) {
            const dateVal = new Date(p.paid_at || p.due_date || p.created_at);
            const key = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}`;
            const found = last6Months.find(m => m.key === key);
            if (found) {
              found.Cobrado += Number(p.amount || 0);
            }
          }
        });

        setChartData(last6Months);

      } catch (err) {
        console.error('Error loading landlord dashboard:', err);
        toast({ type: 'error', message: 'Error al cargar el panel del arrendador.' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Cargando estadísticas de Arrendador...</p>
      </div>
    );
  }

  // Get top 5 recent contracts
  const recentContracts = contracts.slice(0, 5);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Header section */}
      <div className="bg-card border-none shadow-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
            <Sparkles className="w-6 h-6 text-primary" />
            ¡Hola, {profile?.full_name || 'Propietario'}!
          </h2>
          <p className="text-xs text-ink-muted mt-1.5 font-medium max-w-xl">
            Bienvenido a tu panel de Arrendador. Aquí puedes gestionar tus contratos, realizar un seguimiento de tus ingresos y supervisar tus inmuebles.
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 py-3 rounded-xl transition-all shadow-btn hover:shadow-card-hover flex items-center gap-2 shrink-0 active:scale-95 relative z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Contrato</span>
        </Link>
      </div>

      {/* Stats Summary Cards con delta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total properties */}
        <div className="bg-card border-none rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border-none text-primary group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded border-none tabular-nums">
              +0
            </span>
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">
            Propiedades
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1 tabular-nums">
            {stats.totalProperties}
          </span>
          <Link href="/dashboard/properties" className="block text-[10px] text-ink-muted mt-2 font-semibold hover:text-foreground transition-colors">
            Ver catálogo →
          </Link>
        </div>

        {/* Active contracts */}
        <div className="bg-card border-none rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-success/10 border-none text-success group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded border-none flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Activos
            </span>
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">
            Contratos
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1 tabular-nums">
            {stats.activeContracts}
          </span>
          <span className="block text-[10px] text-success mt-2 font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Estable
          </span>
        </div>

        {/* Expected Monthly Income */}
        <div className="bg-card border-none rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border-none text-primary group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">
            Renta Esperada
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1 truncate tabular-nums">
            {formatCurrency(stats.monthlyRevenue)}
          </span>
          <span className="block text-[10px] text-ink-muted mt-2 font-semibold">
            Mes actual
          </span>
        </div>

        {/* Upcoming dues */}
        <div className="bg-card border-none rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-warning/10 border-none text-warning group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            {stats.upcomingThisWeek > 0 && (
              <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded border-none animate-pulse tabular-nums">
                {stats.upcomingThisWeek} pendiente{stats.upcomingThisWeek !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="block text-[11px] font-bold text-ink-secondary uppercase tracking-wider">
            Vencimientos
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1 tabular-nums">
            {stats.upcomingThisWeek}
          </span>
          <Link href="/dashboard/payments" className="block text-[10px] text-ink-muted mt-2 font-semibold hover:text-foreground transition-colors">
            Ir a conciliación →
          </Link>
        </div>

      </div>

      {/* Main Grid: Cashflow Chart & Recent Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow bar chart */}
        <div className="bg-card border-none rounded-2xl p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Flujo de Renta</h3>
              <p className="text-[11px] text-ink-muted mt-0.5">Montos mensuales (últimos 6 meses)</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-success/10 border-none text-success flex items-center gap-1.5 text-[11px] font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              Cobrado
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.85}/>
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#ffffff'
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Cobrado']}
                />
                <Bar
                  dataKey="Cobrado"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumen Operativo */}
        <div className="bg-card border-none rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-border pb-3.5 mb-5">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Resumen Operativo</h3>
            </div>
            
            {/* Ocupación */}
            <div className="mb-5 p-4 rounded-xl bg-muted/30 border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-ink-muted font-semibold">Ocupación</span>
                <span className="text-sm font-extrabold text-primary tabular-nums">
                  {(() => {
                    const rate = properties.length > 0
                      ? Math.round((properties.filter(p => p.status === 'ocupado').length / properties.length) * 100)
                      : 0;
                    return `${rate}%`;
                  })()}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{
                    width: properties.length > 0
                      ? `${(properties.filter(p => p.status === 'ocupado').length / properties.length) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/20 border-none">
                <span className="text-xs text-ink-muted font-semibold">Disponibles</span>
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {properties.filter(p => p.status === 'disponible').length}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/20 border-none">
                <span className="text-xs text-ink-muted font-semibold">Borradores</span>
                <span className="text-xs font-bold text-warning tabular-nums">
                  {contracts.filter(c => c.status === 'borrador').length}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/20 border-none">
                <span className="text-xs text-ink-muted font-semibold">Total renta</span>
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {formatCurrency(contracts.filter(c => c.status === 'activo' || c.status === 'firmado').reduce((sum, c) => sum + Number(c.monthly_rent || 0), 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-border/40 text-[10px] text-ink-muted font-medium text-center">
            Datos actualizados en vivo
          </div>
        </div>

      </div>

      {/* Latest Contracts Table */}
      <div className="bg-card border-none rounded-2xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Últimos Contratos Creados</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Contratos más recientes emitidos por ti</p>
          </div>
          <Link
            href="/dashboard/leases"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
          >
            Ver todos
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-6">Contrato #</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Propiedad</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Arrendatario</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Renta</th>
                <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs text-ink-muted font-medium bg-muted/30">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-card shadow-card flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-ink-muted" />
                      </div>
                      No tienes contratos emitidos todavía.
                    </div>
                  </td>
                </tr>
              ) : (
                recentContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors text-xs">
                    <td className="p-4 font-bold text-foreground pl-6 select-all">{c.contract_number}</td>
                    <td className="p-4 font-medium text-foreground">{c.property?.title || 'Inmueble'}</td>
                    <td className="p-4 font-semibold text-muted-foreground">{c.tenant?.full_name || 'Sin Asignar'}</td>
                    <td className="p-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-4 font-bold text-foreground tabular-nums">{formatCurrency(c.monthly_rent)}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(c.start_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border/60">
          {recentContracts.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-medium">
              No tienes ningún contrato emitido todavía.
            </div>
          ) : (
            recentContracts.map((c) => (
              <div key={c.id} className="p-4 space-y-2.5 hover:bg-muted/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground select-all">{c.contract_number}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground font-medium">Propiedad: </span>
                    <span className="text-foreground font-semibold">{c.property?.title || 'Inmueble'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Inquilino: </span>
                    <span className="text-foreground font-semibold">{c.tenant?.full_name || 'Sin Asignar'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Renta: </span>
                    <span className="text-foreground font-bold">{formatCurrency(c.monthly_rent)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Inicio: </span>
                    <span className="text-foreground">
                      {new Date(c.start_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        href="/contracts/new"
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover text-primary-foreground p-4 rounded-full shadow-btn flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-105 active:scale-95 z-40"
      >
        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
        <span className="font-bold text-sm pr-1 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap">
          Nuevo Contrato
        </span>
      </Link>

    </div>
  );
}
