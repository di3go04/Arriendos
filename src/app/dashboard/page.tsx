'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property, Payment } from '@/types';
import {
  TrendingUp,
  DollarSign,
  AlertOctagon,
  Calendar,
  Building,
  ArrowUpRight,
  Download,
  Filter,
  Plus,
  ArrowRight,
  TrendingDown,
  Clock,
  Briefcase,
  Users,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  morosityRate: number;
  paymentsCount: number;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    morosityRate: 0,
    paymentsCount: 0,
  });
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<Payment[]>([]);
  const [overduePayments, setOverduePayments] = useState<Payment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch initial configuration & dashboard stats
  useEffect(() => {
    if (!user || !profile) return;
    
    const loadDashboardData = async () => {
      setLoadingData(true);
      try {
        // 1. Fetch properties (landlord owns them, tenant is connected through contracts)
        let propsQuery = supabase
          .from('properties')
          .select('*');
        if (profile.role === 'arrendador') {
          propsQuery = propsQuery.eq('owner_id', user.id);
        } else {
          const { data: tenantContracts } = await supabase
            .from('contracts')
            .select('property_id')
            .eq('tenant_id', user.id);
          const propertyIds = (tenantContracts || []).map(c => c.property_id);
          propsQuery = propsQuery.in('id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000']);
        }

        const { data: propsData, error: propsErr } = await propsQuery;
        if (propsErr) throw propsErr;
        setProperties(propsData || []);

        // 2. Fetch payments with contract details
        let query = supabase
          .from('payments')
          .select(`
            *,
            contract:contracts (
              id,
              contract_number,
              monthly_rent,
              property:properties (id, title),
              landlord:profiles!contracts_landlord_id_fkey (id, full_name),
              tenant:profiles!contracts_tenant_id_fkey (id, full_name)
            )
          `);

        if (profile.role === 'arrendatario') {
          query = query.eq('tenant_id', user.id);
        } else {
          query = query.eq('contract.landlord_id', user.id);
        }

        const { data: paymentsData, error: paymentsErr } = await query;
        if (paymentsErr) throw paymentsErr;

        let payments: Payment[] = (paymentsData as any[]) || [];
        payments = payments.filter(p => p.contract !== null);

        if (selectedPropertyId !== 'all') {
          payments = payments.filter(p => p.contract?.property?.id === selectedPropertyId);
        }
        
        // 3. Process metrics and KPIs
        calculateMetrics(payments);
        
        // 4. Process Chart Data
        processChartData(payments);

        // 5. Categorize payments into alerts
        categorizePayments(payments);

      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user, profile, selectedPropertyId, selectedPeriod]);

  const calculateMetrics = (payments: Payment[]) => {
    const today = new Date();
    
    // Filter payments based on period
    let filtered = payments;
    if (selectedPeriod === 'current-month') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      filtered = payments.filter(p => {
        const d = new Date(p.due_date);
        return d >= start && d <= end;
      });
    } else if (selectedPeriod === 'last-30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      filtered = payments.filter(p => new Date(p.due_date) >= thirtyDaysAgo);
    }

    let paidSum = 0;
    let pendingSum = 0;
    let overdueSum = 0;

    filtered.forEach(p => {
      const amount = Number(p.amount);
      const isOverdue = new Date(p.due_date) < today && !p.paid;
      
      if (p.paid) {
        paidSum += amount;
      } else if (isOverdue) {
        overdueSum += amount;
      } else {
        pendingSum += amount;
      }
    });

    const totalBilled = paidSum + pendingSum + overdueSum;
    const rate = totalBilled > 0 ? (overdueSum / totalBilled) * 100 : 0;

    setStats({
      totalPaid: paidSum,
      totalPending: pendingSum,
      totalOverdue: overdueSum,
      morosityRate: rate,
      paymentsCount: filtered.length,
    });
  };

  const processChartData = (payments: Payment[]) => {
    const monthlyGroups: { [month: string]: { [propName: string]: number } } = {};
    const propertyNames = new Set<string>();

    payments.forEach(p => {
      if (!p.paid || !p.paid_at) return;
      
      const date = new Date(p.paid_at);
      const monthLabel = format(date, 'MMM yyyy', { locale: es });
      const propName = p.contract?.property?.title || 'Inmueble Desconocido';
      
      propertyNames.add(propName);
      
      if (!monthlyGroups[monthLabel]) {
        monthlyGroups[monthLabel] = {};
      }
      monthlyGroups[monthLabel][propName] = (monthlyGroups[monthLabel][propName] || 0) + Number(p.amount);
    });

    const data = Object.keys(monthlyGroups).map(month => {
      const item: any = { name: month };
      propertyNames.forEach(name => {
        item[name] = monthlyGroups[month][name] || 0;
      });
      return item;
    });

    data.sort((a, b) => {
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const partsA = a.name.split(' ');
      const partsB = b.name.split(' ');
      const yearA = parseInt(partsA[1]);
      const yearB = parseInt(partsB[1]);
      if (yearA !== yearB) return yearA - yearB;
      return months.indexOf(partsA[0].toLowerCase()) - months.indexOf(partsB[0].toLowerCase());
    });

    setChartData(data);
  };

  const categorizePayments = (payments: Payment[]) => {
    const today = new Date();
    
    const upcoming = payments
      .filter(p => {
        const due = new Date(p.due_date);
        return !p.paid && due >= today && differenceInDays(due, today) <= 15;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);

    const overdue = payments
      .filter(p => {
        const due = new Date(p.due_date);
        return !p.paid && due < today;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);

    setUpcomingPayments(upcoming);
    setOverduePayments(overdue);
  };

  // CSV Report Generator
  const handleExportCSV = () => {
    if (stats.paymentsCount === 0 || !user || !profile) return;
    
    const headers = ['Inmueble', 'Inquilino', 'Fecha de Vencimiento', 'Fecha de Pago', 'Monto', 'Estado', 'Notas'];
    
    // We fetch all payments to generate a detailed report
    let query = supabase
      .from('payments')
      .select(`
        amount,
        due_date,
        paid_at,
        paid,
        notes,
        contract:contracts (
          property:properties (title),
          tenant:profiles!contracts_tenant_id_fkey (full_name)
        )
      `);

    if (profile.role === 'arrendatario') {
      query = query.eq('tenant_id', user.id);
    } else {
      query = query.eq('contract.landlord_id', user.id);
    }

    query.then(({ data }) => {
      if (!data) return;

      const sanitized = (data as any[]).filter(p => p.contract !== null);

      const rows = sanitized.map((p: any) => [
        p.contract?.property?.title || 'N/A',
        p.contract?.tenant?.full_name || 'N/A',
        p.due_date,
        p.paid_at ? format(new Date(p.paid_at), 'yyyy-MM-dd') : 'Sin pagar',
        p.amount,
        p.paid ? 'Pagado' : (new Date(p.due_date) < new Date() ? 'Vencido' : 'Pendiente'),
        p.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Arrendo_Reporte_Financiero_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const currencySymbol = profile?.preferred_currency || 'USD';

  // Loading indicator screen
  if (loadingData && properties.length === 0) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-muted rounded-2xl" />
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  // Pure Empty State if landlord has absolutely no properties created
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-20 max-w-2xl mx-auto text-center space-y-6">
        <div className="p-5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-bounce">
          <Building className="w-16 h-16" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ¡Te damos la bienvenida a Arrendo!
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
            Comienza a digitalizar la administración de tus alquileres. Para empezar a visualizar indicadores financieros, gráficos de ingresos e informes, debes registrar tu primera propiedad.
          </p>
        </div>

        {/* Step-by-Step guide widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mt-8">
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded">Paso 1</span>
            <h4 className="font-bold text-sm text-foreground mt-2 flex items-center gap-1.5">
              Crear Propiedad <ArrowRight className="w-3.5 h-3.5" />
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1">Registra casas, apartamentos o locales.</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded">Paso 2</span>
            <h4 className="font-bold text-sm text-foreground mt-2 flex items-center gap-1.5">
              Añadir Inquilino <ArrowRight className="w-3.5 h-3.5" />
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1">Guarda los datos del arrendatario.</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded">Paso 3</span>
            <h4 className="font-bold text-sm text-foreground mt-2 flex items-center gap-1.5">
              Activar Contrato <ArrowRight className="w-3.5 h-3.5" />
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1">Asigna el inquilino y calendariza cobros.</p>
          </div>
        </div>

        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/15 transition-all text-sm group"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar mi Primer Inmueble</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top filters and report exporter panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card border border-border p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
          {/* Property selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="bg-muted text-foreground text-xs font-semibold rounded-lg border border-border p-2 outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">Todas las Propiedades</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Period selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-muted text-foreground text-xs font-semibold rounded-lg border border-border p-2 outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="current-month">Este Mes</option>
            <option value="last-30">Últimos 30 Días</option>
            <option value="all-time">Todo el Historial</option>
          </select>
        </div>

        {/* CSV Exporter */}
        <button
          onClick={handleExportCSV}
          disabled={stats.paymentsCount === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground font-semibold rounded-xl text-xs transition-all border border-border disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Monthly earnings */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-success/10 border border-success/20 rounded-xl text-success group-hover:scale-105 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Ingresos Recibidos
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2">
            {currencySymbol} {stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-success font-semibold flex items-center gap-1 mt-2.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> Pago total confirmado
          </span>
        </div>

        {/* KPI 2: Current pending bills */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-warning/10 border border-warning/20 rounded-xl text-warning group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Por Cobrar (Pendiente)
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2">
            {currencySymbol} {stats.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-warning font-semibold flex items-center gap-1 mt-2.5">
            <Calendar className="w-3.5 h-3.5" /> Vence en el periodo activo
          </span>
        </div>

        {/* KPI 3: Total late/overdue payments */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive group-hover:scale-105 transition-transform">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Saldo Vencido (Mora)
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2">
            {currencySymbol} {stats.totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-2.5">
            <TrendingDown className="w-3.5 h-3.5" /> Cobros atrasados pendientes
          </span>
        </div>

        {/* KPI 4: Delinquency Rate */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary group-hover:scale-105 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Tasa de Morosidad
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2">
            {stats.morosityRate.toFixed(1)}%
          </span>
          <div className="mt-2.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                stats.morosityRate > 15 ? 'bg-destructive' : stats.morosityRate > 0 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${Math.min(stats.morosityRate, 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Main Section: Chart and Alerts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Income Chart using Recharts */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Ingresos Mensuales por Inmueble
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold">
                Suma total de cobros conciliados (`Pagados`) agrupados por mes
              </p>
            </div>
          </div>
          
          <div className="h-80 w-full text-xs">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20 border border-dashed border-border rounded-xl">
                <Briefcase className="w-8 h-8 opacity-40" />
                <p className="text-xs font-semibold">Sin datos de facturación</p>
                <p className="text-[10px] text-center max-w-[200px]">Los ingresos se graficarán una vez marques cobros como pagados.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  {/* Generate dynamic bars based on properties */}
                  {Object.keys(chartData[0] || {})
                    .filter(key => key !== 'name')
                    .map((propName, index) => (
                      <Bar
                        key={propName}
                        dataKey={propName}
                        stackId="a"
                        fill={['#3b82f6', '#10b981', '#fbbf24', '#f87171', '#a855f7'][index % 5]}
                        radius={[index === Object.keys(chartData[0] || {}).length - 2 ? 4 : 0, index === Object.keys(chartData[0] || {}).length - 2 ? 4 : 0, 0, 0]}
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel of Billing Alerts (Morosity & Upcoming Payments) */}
        <div className="space-y-6">
          
          {/* Overdue/Late list */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <AlertOctagon className="w-4 h-4 text-destructive" /> Alertas de Morosidad
            </h3>

            {overduePayments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-1.5 border border-dashed border-border rounded-xl">
                <Check className="w-6 h-6 text-success bg-success/10 p-1 rounded-full" />
                <span className="text-xs font-semibold text-foreground">¡Todo en regla!</span>
                <span className="text-[10px]">No tienes ningún cobro vencido.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {overduePayments.map(p => {
                  const daysLate = differenceInDays(new Date(), new Date(p.due_date));
                  const tenantName = p.contract?.tenant?.full_name || 'Inquilino';
                  const propName = p.contract?.property?.title || 'Inmueble';

                  return (
                    <div key={p.id} className="p-3 bg-destructive/5 border border-destructive/15 hover:border-destructive/30 rounded-xl flex items-start gap-2.5 transition-all text-xs">
                      <div className="p-1 rounded-lg bg-destructive/10 text-destructive mt-0.5 shrink-0">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-foreground truncate">{tenantName}</span>
                          <span className="bg-destructive/10 text-destructive text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            Hace {daysLate} días
                          </span>
                        </div>
                        <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                          {propName}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-destructive/10">
                          <span className="text-primary font-bold">
                            {currencySymbol} {Number(p.amount).toLocaleString()}
                          </span>
                          <Link href="/dashboard/payments" className="text-[9px] font-bold text-primary hover:underline flex items-center gap-0.5">
                            Gestionar <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Payments list */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-warning" /> Próximos Vencimientos
            </h3>

            {upcomingPayments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-1.5 border border-dashed border-border rounded-xl">
                <Users className="w-6 h-6 text-muted-foreground/40" />
                <span className="text-xs font-semibold">Sin cobros próximos</span>
                <span className="text-[10px] max-w-[150px]">No hay vencimientos programados en los próximos 15 días.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map(p => {
                  const tenantName = p.contract?.tenant?.full_name || 'Inquilino';
                  const propName = p.contract?.property?.title || 'Inmueble';

                  return (
                    <div key={p.id} className="p-3 bg-muted/40 border border-border hover:border-muted-foreground/30 rounded-xl flex items-start gap-2.5 transition-all text-xs">
                      <div className="p-1 rounded-lg bg-warning/10 text-warning mt-0.5 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-foreground truncate">{tenantName}</span>
                          <span className="text-muted-foreground text-[10px] font-semibold">
                            {format(new Date(p.due_date), 'dd MMM', { locale: es })}
                          </span>
                        </div>
                        <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                          {propName}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border">
                          <span className="text-primary font-bold">
                            {currencySymbol} {Number(p.amount).toLocaleString()}
                          </span>
                          <Link href="/dashboard/payments" className="text-[9px] font-bold text-primary hover:underline flex items-center gap-0.5">
                            Cobrar <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
