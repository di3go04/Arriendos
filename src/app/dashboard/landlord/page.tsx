'use client';

import React, { useState, useEffect } from 'react';
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
      
      {/* Header section — firma terracota */}
      <div className="bg-gradient-to-br from-amber-600/20 via-orange-500/10 to-transparent border border-amber-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
            <Sparkles className="w-6 h-6 text-amber-500" />
            ¡Hola, {profile?.full_name || 'Propietario'}!
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium max-w-xl">
            Bienvenido a tu panel de Arrendador. Aquí puedes gestionar tus contratos, realizar un seguimiento de tus ingresos y supervisar tus inmuebles.
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 flex items-center gap-2 shrink-0 active:scale-[0.97] relative z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Contrato</span>
        </Link>
      </div>

      {/* Stats Summary Cards con delta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total properties */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              +0
            </span>
          </div>
          <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Propiedades Registradas
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1">
            {stats.totalProperties}
          </span>
          <Link href="/properties" className="block text-[10px] text-muted-foreground mt-2 font-semibold hover:text-foreground transition-colors">
            Ver catálogo completo →
          </Link>
        </div>

        {/* Active contracts */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Activos
            </span>
          </div>
          <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Contratos Activos
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1">
            {stats.activeContracts}
          </span>
          <span className="block text-[10px] text-emerald-500 mt-2 font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Flujo de renta estable
          </span>
        </div>

        {/* Expected Monthly Income */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Renta Mensual Esperada
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1 truncate">
            {formatCurrency(stats.monthlyRevenue)}
          </span>
          <span className="block text-[10px] text-muted-foreground mt-2 font-semibold">
            Basado en cánones activos
          </span>
        </div>

        {/* Upcoming dues */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Calendar className="w-5 h-5" />
            </div>
            {stats.upcomingThisWeek > 0 && (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                {stats.upcomingThisWeek} pendiente{stats.upcomingThisWeek !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Vencimientos esta semana
          </span>
          <span className="block text-3xl font-extrabold text-foreground mt-1">
            {stats.upcomingThisWeek}
          </span>
          <Link href="/dashboard/payments" className="block text-[10px] text-muted-foreground mt-2 font-semibold hover:text-foreground transition-colors">
            Ir a conciliación →
          </Link>
        </div>

      </div>

      {/* Main Grid: Cashflow Chart & Recent Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow bar chart — paleta terracota (Span 2) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Flujo de Renta Recibida</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Montos mensuales cobrados (últimos 6 meses)</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-1.5 text-[11px] font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              Cobrado
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.85}/>
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
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

        {/* Resumen Operativo — semáforo visual */}
        <div className="bg-gradient-to-b from-card to-card/60 border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-border pb-3.5 mb-5">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">Resumen Operativo</h3>
            </div>
            
            {/* Ocupación - hero del resumen */}
            <div className="mb-5 p-4 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-muted-foreground font-semibold">Ocupación</span>
                <span className="text-sm font-extrabold text-emerald-500">
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
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{
                    width: properties.length > 0
                      ? `${(properties.filter(p => p.status === 'ocupado').length / properties.length) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-xs text-muted-foreground font-semibold">Disponibles</span>
                <span className="text-xs font-bold text-foreground">
                  {properties.filter(p => p.status === 'disponible').length}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-xs text-muted-foreground font-semibold">Borradores</span>
                <span className="text-xs font-bold text-amber-500">
                  {contracts.filter(c => c.status === 'borrador').length}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-xs text-muted-foreground font-semibold">Total renta cartera</span>
                <span className="text-xs font-bold text-foreground">
                  {formatCurrency(contracts.filter(c => c.status === 'activo' || c.status === 'firmado').reduce((sum, c) => sum + Number(c.monthly_rent || 0), 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-border/40 text-[10px] text-muted-foreground font-medium text-center">
            Datos actualizados en vivo desde Supabase
          </div>
        </div>

      </div>

      {/* Latest Contracts Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
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
            <tbody className="divide-y divide-border/60">
              {recentContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground font-medium">
                    No tienes ningún contrato emitido todavía.
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
                    <td className="p-4 font-bold text-foreground">{formatCurrency(c.monthly_rent)}</td>
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

      {/* Hover Expanding Floating FAB Button — terracota */}
      <Link
        href="/contracts/new"
        className="fixed bottom-6 right-6 bg-amber-600 hover:bg-amber-700 text-white p-4.5 rounded-full shadow-2xl shadow-amber-600/20 flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-105 active:scale-95 z-40"
      >
        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
        <span className="font-bold text-sm pr-1 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap">
          Nuevo Contrato
        </span>
      </Link>

    </div>
  );
}
