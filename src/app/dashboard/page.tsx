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
        // Use two-step approach to avoid Supabase nested join alias issues (profiles_2)
        let payments: any[] = [];

        if (profile.role === 'arrendatario') {
          const { data: pays, error: paysErr } = await supabase
            .from('payments').select(`*`).eq('tenant_id', user.id).order('due_date', { ascending: false });
          if (paysErr) throw paysErr;

          const rawPays: any[] = pays || [];
          const contractIds = [...new Set(rawPays.map(p => p.contract_id))];
          if (contractIds.length > 0) {
            const { data: contracts } = await supabase
              .from('contracts').select('id, contract_number, monthly_rent, property:properties(id, title), landlord:profiles!contracts_landlord_id_fkey(id, full_name), tenant:profiles!contracts_tenant_id_fkey(id, full_name)')
              .in('id', contractIds);
            payments = rawPays.map(p => ({
              ...p,
              contract: (contracts || []).find(c => c.id === p.contract_id) || null
            })).filter(p => p.contract);
          }
        } else {
          const { data: contracts } = await supabase
            .from('contracts').select('id, contract_number, monthly_rent, property:properties(id, title), landlord:profiles!contracts_landlord_id_fkey(id, full_name), tenant:profiles!contracts_tenant_id_fkey(id, full_name)')
            .eq('landlord_id', user.id);
          const contractIds = (contracts || []).map(c => c.id);

          if (contractIds.length > 0) {
            const { data: pays, error: paysErr } = await supabase
              .from('payments').select(`*`).in('contract_id', contractIds).order('due_date', { ascending: false });
            if (paysErr) throw paysErr;
            payments = ((pays as any[]) || []).map(p => ({
              ...p,
              contract: (contracts || []).find(c => c.id === p.contract_id) || null
            })).filter(p => p.contract);
          }
        }

        if (selectedPropertyId !== 'all') {
          payments = payments.filter(p => p.contract?.property?.id === selectedPropertyId);
        }
        
        calculateMetrics(payments);
        processChartData(payments);
        categorizePayments(payments);

      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user, profile, selectedPropertyId, selectedPeriod]);

  const calculateMetrics = (payments: any[]) => {
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

  const processChartData = (payments: any[]) => {
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

  const categorizePayments = (payments: any[]) => {
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
  const handleExportCSV = async () => {
    if (stats.paymentsCount === 0 || !user || !profile) return;
    
    const headers = ['Inmueble', 'Inquilino', 'Fecha de Vencimiento', 'Fecha de Pago', 'Monto', 'Estado', 'Notas'];
    
    try {
      let payments: any[] = [];

      if (profile.role === 'arrendatario') {
        const { data } = await supabase
          .from('payments')
          .select(`amount, due_date, paid_at, paid, notes, contract_id`)
          .eq('tenant_id', user.id);
        if (!data) return;
        const contractIds = [...new Set(data.map(p => p.contract_id))];
        const { data: contracts } = contractIds.length > 0 
          ? await supabase.from('contracts').select(`id, property:properties(title), tenant:profiles!contracts_tenant_id_fkey(full_name)`).in('id', contractIds)
          : { data: [] };
        payments = data.map(p => ({ ...p, contract: (contracts || []).find(c => c.id === p.contract_id) || null }));
      } else {
        const { data: contracts } = await supabase
          .from('contracts')
          .select(`id, property:properties(title), tenant:profiles!contracts_tenant_id_fkey(full_name)`)
          .eq('landlord_id', user.id);
        const contractIds = (contracts || []).map(c => c.id);
        if (contractIds.length === 0) return;
        const { data } = await supabase
          .from('payments')
          .select(`amount, due_date, paid_at, paid, notes, contract_id`)
          .in('contract_id', contractIds);
        if (!data) return;
        payments = data.map(p => ({ ...p, contract: (contracts || []).find(c => c.id === p.contract_id) || null }));
      }

      const sanitized = payments.filter(p => p.contract !== null);

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
      link.setAttribute('download', `RentNow_Reporte_Financiero_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
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
            ¡Te damos la bienvenida a RentNow!
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
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow-btn hover:shadow-card-hover transition-all text-sm group"
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
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-card border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
          {/* Property Segmented Control */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
            <Filter className="w-4 h-4 text-ink-muted shrink-0 hidden sm:block" />
            <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full pb-1 md:pb-0">
              <button
                onClick={() => setSelectedPropertyId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border-none ${
                  selectedPropertyId === 'all'
                    ? 'bg-foreground text-background shadow-btn'
                    : 'bg-muted/50 text-ink-muted hover:bg-muted hover:text-foreground'
                }`}
              >
                Todas las Propiedades
              </button>
              {properties.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPropertyId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border-none ${
                    selectedPropertyId === p.id
                      ? 'bg-foreground text-background shadow-btn'
                      : 'bg-muted/50 text-ink-muted hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Period Segmented Control */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'current-month', label: 'Este Mes' },
              { id: 'last-30', label: 'Últimos 30 Días' },
              { id: 'all-time', label: 'Historial' }
            ].map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border-none ${
                  selectedPeriod === period.id
                    ? 'bg-primary text-primary-foreground shadow-btn'
                    : 'bg-muted/50 text-ink-muted hover:bg-muted hover:text-foreground'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* CSV Exporter */}
        <button
          onClick={handleExportCSV}
          disabled={stats.paymentsCount === 0}
          className="w-full xl:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-xl text-xs transition-all border-none shadow-btn disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Monthly earnings */}
        <div className="bg-card border-none p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-success/10 border-none rounded-xl text-success group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider block">
            Ingresos Recibidos
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2 tabular-nums">
            {currencySymbol} {stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-success font-semibold flex items-center gap-1 mt-2.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> Pago total confirmado
          </span>
        </div>

        {/* KPI 2: Current pending bills */}
        <div className="bg-card border-none p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-warning/10 border-none rounded-xl text-warning group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider block">
            Por Cobrar (Pendiente)
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2 tabular-nums">
            {currencySymbol} {stats.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-warning font-semibold flex items-center gap-1 mt-2.5">
            <Calendar className="w-3.5 h-3.5" /> Vence en el periodo activo
          </span>
        </div>

        {/* KPI 3: Total late/overdue payments */}
        <div className="bg-card border-none p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-destructive/10 border-none rounded-xl text-destructive group-hover:scale-110 transition-transform">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider block">
            Saldo Vencido (Mora)
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2 tabular-nums">
            {currencySymbol} {stats.totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-2.5">
            <TrendingDown className="w-3.5 h-3.5" /> Cobros atrasados pendientes
          </span>
        </div>

        {/* KPI 4: Delinquency Rate */}
        <div className="bg-card border-none p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-3 top-3 p-3 bg-primary/10 border-none rounded-xl text-primary group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider block">
            Tasa de Morosidad
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-foreground block mt-2 tabular-nums">
            {stats.morosityRate.toFixed(1)}%
          </span>
          <div className="mt-2.5 w-full bg-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] rounded-full h-1.5 overflow-hidden">
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
        <div className="bg-card border-none p-6 rounded-2xl shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Ingresos Mensuales por Inmueble
              </h3>
              <p className="text-[11px] text-ink-muted font-semibold">
                Suma total de cobros conciliados (`Pagados`) agrupados por mes
              </p>
            </div>
          </div>
          
          <div className="h-80 w-full text-xs">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-muted gap-2 bg-muted/30 border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-xl">
                <Briefcase className="w-8 h-8 opacity-40" />
                <p className="text-xs font-semibold text-foreground">Sin datos de facturación</p>
                <p className="text-[10px] text-center max-w-[200px]">Los ingresos se graficarán una vez marques cobros como pagados.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
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
          <div className="bg-card border-none p-6 rounded-2xl shadow-card">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <AlertOctagon className="w-4 h-4 text-destructive" /> Alertas de Morosidad
            </h3>

            {overduePayments.length === 0 ? (
              <div className="py-8 text-center text-ink-muted flex flex-col items-center justify-center gap-1.5 bg-muted/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-xl">
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
                    <div key={p.id} className="p-3 bg-destructive/5 border-none shadow-[inset_0_0_0_1px_rgba(239,68,68,0.15)] hover:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.3)] rounded-xl flex items-start gap-2.5 transition-all text-xs">
                      <div className="p-1 rounded-lg bg-destructive/10 text-destructive mt-0.5 shrink-0">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-foreground truncate">{tenantName}</span>
                          <span className="bg-destructive/10 text-destructive text-[9px] font-extrabold px-2 py-0.5 rounded border-none shrink-0">
                            Hace {daysLate} días
                          </span>
                        </div>
                        <span className="block text-[10px] text-ink-muted truncate mt-0.5">
                          {propName}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-destructive/10">
                          <span className="text-destructive font-bold tabular-nums">
                            {currencySymbol} {Number(p.amount).toLocaleString()}
                          </span>
                          <Link href="/dashboard/payments" className="text-[9px] font-bold text-destructive hover:underline flex items-center gap-0.5">
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
          <div className="bg-card border-none p-6 rounded-2xl shadow-card">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-warning" /> Próximos Vencimientos
            </h3>

            {upcomingPayments.length === 0 ? (
              <div className="py-8 text-center text-ink-muted flex flex-col items-center justify-center gap-1.5 bg-muted/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-xl">
                <Users className="w-6 h-6 text-ink-muted/40" />
                <span className="text-xs font-semibold text-foreground">Sin cobros próximos</span>
                <span className="text-[10px] max-w-[150px]">No hay vencimientos programados en los próximos 15 días.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map(p => {
                  const tenantName = p.contract?.tenant?.full_name || 'Inquilino';
                  const propName = p.contract?.property?.title || 'Inmueble';

                  return (
                    <div key={p.id} className="p-3 bg-muted/20 border-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] rounded-xl flex items-start gap-2.5 transition-all text-xs">
                      <div className="p-1 rounded-lg bg-warning/10 text-warning mt-0.5 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-foreground truncate">{tenantName}</span>
                          <span className="text-ink-secondary text-[10px] font-semibold">
                            {format(new Date(p.due_date), 'dd MMM', { locale: es })}
                          </span>
                        </div>
                        <span className="block text-[10px] text-ink-muted truncate mt-0.5">
                          {propName}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                          <span className="text-foreground font-bold tabular-nums">
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
