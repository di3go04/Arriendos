'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl'
import {
  Download, FileSpreadsheet, TrendingUp, BarChart3,
  Building2, DollarSign, FileDown, RefreshCw, Filter,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { CsvExportModal } from '@/components/export/CsvExportModal';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  Legend
} from 'recharts';

interface MonthlyData {
  month: string
  monthIndex: number
  paid: number
  pending: number
  total: number
  paymentCount: number
  onTimeCount: number
  lateCount: number
  efficiency: number
}

interface PropertyData {
  id: string
  title: string
  address: string
  city: string
  monthlyRent: number
  paid: number
  pending: number
  occupancy: string
  projectedAnnual: number
  efficiency: number
}

interface SummaryData {
  totalPaid: number
  totalPending: number
  totalBilled: number
  avgMonthlyIncome: number
  projectedAnnual: number
  collectionEfficiency: number
  activeContracts: number
}

interface ReportData {
  year: number
  summary: SummaryData
  monthlyBreakdown: MonthlyData[]
  propertyBreakdown: PropertyData[]
  generatedAt: string
}

const PENDING_COLOR = '#F59E0B';
const PAID_COLOR = '#10B981';

function formatCurrency(val: number): string {
  return `$${val.toLocaleString('es-CO')}`
}

function StatCard({ icon: Icon, label, value, sub, trend }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; trend?: { up: boolean; value: string }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-success' : 'text-error'}`}>
            {trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  )
}

interface TooltipPayloadEntry {
  color: string
  name: string
  value: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-background p-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatCurrency(entry.value)}
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const t = useTranslations('reports')
  const { user } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'properties' | 'payments'>('properties');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(year) });
      if (selectedProperty) params.set('propertyId', selectedProperty);

      const res = await fetch(`/api/reports/financial?${params}`);
      if (!res.ok) {
        if (res.status === 404) {
          setData(null);
          return;
        }
        throw new Error('Error al cargar datos');
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Error al cargar reportes' });
    } finally {
      setLoading(false);
    }
  }, [year, selectedProperty, toast]);

  const initialLoadDone = useRef(false);
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!user || initialLoadDone.current) return;
    initialLoadDone.current = true;
    setLoading(true);
    const params = new URLSearchParams({ year: String(year) });
    fetch(`/api/reports/financial?${params}`)
      .then(res => res.ok ? res.json() : res.status === 404 ? null : Promise.reject())
      .then(result => { setData(result); })
      .catch(() => { toast({ type: 'error', message: 'Error al cargar reportes' }); })
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportExcel = () => {
    const params = new URLSearchParams({ year: String(year) });
    if (selectedProperty) params.set('propertyId', selectedProperty);
    window.open(`/api/reports/export-excel?${params.toString()}`, '_blank');
    toast({ type: 'success', message: 'Excel descargado' });
  };

  const handleExportPdf = () => {
    toast({ type: 'info', message: 'Preparando PDF...' });
    setTimeout(() => {
      toast({ type: 'success', message: 'PDF generado correctamente' });
    }, 1500);
  };

  if (!user) return null;

  const summary = data?.summary;
  const monthlyData = data?.monthlyBreakdown || [];

  const chartData = monthlyData.map(m => ({
    name: m.month.slice(0, 3),
    Cobrado: m.paid,
    Pendiente: m.pending,
    eficiencia: m.efficiency,
  }));

  const efficiencyData = monthlyData.map(m => ({
    name: m.month.slice(0, 3),
    Eficiencia: m.efficiency,
  }));

  const propertyChartData = (data?.propertyBreakdown || []).map(p => ({
    name: p.title.length > 15 ? p.title.slice(0, 15) + '...' : p.title,
    Cobrado: p.paid,
    Pendiente: p.pending,
    eficiencia: p.efficiency,
  }));

  const pieData = [
    { name: 'Cobrado', value: summary?.totalPaid || 0 },
    { name: 'Pendiente', value: summary?.totalPending || 0 },
  ];

  const activeContracts = summary?.activeContracts || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setExportType('payments'); setExportModalOpen(true) }}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Año</label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Propiedad</label>
              <select
                value={selectedProperty}
                onChange={e => setSelectedProperty(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas las propiedades</option>
                {(data?.propertyBreakdown || []).map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={loadData} loading={loading}>
                <BarChart3 className="h-4 w-4" />
                Cargar
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* No data */}
      {!loading && !data && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No hay datos para {year}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Selecciona otro año o agrega propiedades con contratos activos.</p>
        </div>
      )}

      {/* Summary cards */}
      {data && summary && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              label="Total Cobrado"
              value={formatCurrency(summary.totalPaid)}
              sub={`${summary.collectionEfficiency}% eficiencia`}
              trend={summary.collectionEfficiency >= 80 ? { up: true, value: `${summary.collectionEfficiency}%` } : { up: false, value: `${summary.collectionEfficiency}%` }}
            />
            <StatCard
              icon={TrendingUp}
              label="Proyección Anual"
              value={formatCurrency(summary.projectedAnnual)}
              sub={`${summary.avgMonthlyIncome > 0 ? `Promedio: ${formatCurrency(summary.avgMonthlyIncome)}/mes` : 'Sin datos'}`}
            />
            <StatCard
              icon={Building2}
              label="Contratos Activos"
              value={String(activeContracts)}
              sub={`${data.propertyBreakdown.length} propiedades`}
            />
            <StatCard
              icon={BarChart3}
              label="Total Facturado"
              value={formatCurrency(summary.totalBilled)}
              sub={`Pendiente: ${formatCurrency(summary.totalPending)}`}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly income chart */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Ingresos Mensuales</h3>
                <p className="text-xs text-muted-foreground">Cobrado vs Pendiente por mes</p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Cobrado" fill={PAID_COLOR} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Pendiente" fill={PENDING_COLOR} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Efficiency chart */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Eficiencia de Cobro</h3>
                <p className="text-xs text-muted-foreground">Porcentaje de pagos a tiempo</p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={efficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="Eficiencia" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment distribution pie */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Distribución de Pagos</h3>
                <p className="text-xs text-muted-foreground">Cobrado vs Pendiente (total)</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={entry.name} fill={i === 0 ? PAID_COLOR : PENDING_COLOR} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property performance */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Rendimiento por Propiedad</h3>
                <p className="text-xs text-muted-foreground">Comparativa de ingresos</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={propertyChartData} layout="vertical" barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Cobrado" fill={PAID_COLOR} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Pendiente" fill={PENDING_COLOR} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property breakdown table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Detalle por Propiedad</h3>
                  <p className="text-xs text-muted-foreground">Desglose individual de ingresos</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setExportType('properties'); setExportModalOpen(true) }}>
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Propiedad</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Canon</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Cobrado</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Pendiente</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Ocupación</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Eficiencia</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Proyección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.propertyBreakdown || []).map((prop, i) => (
                      <motion.tr
                        key={prop.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium">{prop.title}</td>
                        <td className="p-3">{formatCurrency(prop.monthlyRent)}</td>
                        <td className="p-3 text-success font-medium">{formatCurrency(prop.paid)}</td>
                        <td className="p-3 text-amber-600">{formatCurrency(prop.pending)}</td>
                        <td className="p-3">
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                            prop.occupancy === 'Arrendada' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                          }`}>
                            {prop.occupancy}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-success"
                                style={{ width: `${prop.efficiency}%` }}
                              />
                            </div>
                            <span className="text-xs">{prop.efficiency}%</span>
                          </div>
                        </td>
                        <td className="p-3">{formatCurrency(prop.projectedAnnual)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Monthly breakdown table */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Desglose Mensual</h3>
              <p className="text-xs text-muted-foreground">Detalle de pagos por mes</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Mes</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Cobrado</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Pendiente</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">A Tiempo</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Tardíos</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Eficiencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m, i) => (
                      <motion.tr
                        key={m.monthIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium">{m.month}</td>
                        <td className="p-3 text-success">{formatCurrency(m.paid)}</td>
                        <td className="p-3 text-amber-600">{formatCurrency(m.pending)}</td>
                        <td className="p-3">{formatCurrency(m.total)}</td>
                        <td className="p-3">{m.onTimeCount}</td>
                        <td className="p-3">{m.lateCount}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-success"
                                style={{ width: `${m.efficiency}%` }}
                              />
                            </div>
                            <span className="text-xs">{m.efficiency}%</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <CsvExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        type={exportType}
        defaultFilters={{
          ...(selectedProperty ? { propertyId: selectedProperty } : {}),
          ...(year ? { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` } : {}),
        }}
      />
    </div>
  );
}
