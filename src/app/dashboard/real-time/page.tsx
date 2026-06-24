'use client';

import { useTranslations } from 'next-intl'
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { LucideIcon } from 'lucide-react';
import {
  Shield, Phone, Building2, Leaf, BarChart3,
  TrendingUp, Users, DollarSign, Home, RefreshCw
} from 'lucide-react';

interface LiveMetrics {
  kycToday: number;
  kycVerified: number;
  kycRejected: number;
  callsToday: number;
  callsConnected: number;
  commitmentsToday: number;
  reasMrr: number;
  reasSubscriptions: number;
  reasOccupancy: number;
  esgAverage: number;
  toursActive: number;
  reconciliationPending: number;
  recsClicked: number;
}

function KpiCard({
  icon: Icon, label, value, sub, color = 'blue', trend
}: {
  icon: LucideIcon; label: string; value: string | number; sub?: string; color?: string; trend?: 'up' | 'down' | 'neutral';
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-rose-600',
    yellow: 'from-yellow-500 to-amber-600',
    purple: 'from-purple-500 to-violet-600',
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <div className={`rounded-lg bg-gradient-to-br p-2 text-white ${colors[color] || colors.blue}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <TrendingUp className={`h-4 w-4 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-zinc-400'}`} />
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-zinc-400">{sub}</p>}
    </div>
  );
}

export default function RealTimeDashboard() {
  const t = useTranslations('real_time')
  const [metrics, setMetrics] = useState<LiveMetrics>({
    kycToday: 0, kycVerified: 0, kycRejected: 0,
    callsToday: 0, callsConnected: 0, commitmentsToday: 0,
    reasMrr: 0, reasSubscriptions: 0, reasOccupancy: 0,
    esgAverage: 0, toursActive: 0, reconciliationPending: 0, recsClicked: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/modules/dashboard-alerts/metrics');
      const data = await res.json();
      if (data.ok) {
        setMetrics(prev => ({
          ...prev,
          reasMrr: data.data.mrr || 0,
        }));
      }
      setLastUpdate(new Date());
    } catch { /* poll fallback */ }
  }, []);

  useEffect(() => {
    const id = setTimeout(fetchAll, 0);
    const interval = setInterval(fetchAll, 30000);
    return () => { clearTimeout(id); clearInterval(interval); };
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase.channel('live-metrics')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kyc_documents' },
        () => setMetrics(m => ({ ...m, kycToday: m.kycToday + 1 }))
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'collection_calls' },
        () => setMetrics(m => ({ ...m, callsToday: m.callsToday + 1 }))
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reas_subscriptions', filter: 'status=eq.active' },
        () => setMetrics(m => ({ ...m, reasSubscriptions: m.reasSubscriptions + 1 }))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-zinc-500">
            {t('last_update', { time: lastUpdate.toLocaleTimeString('es-CO') })}
          </p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
          <RefreshCw className="h-4 w-4" />
          {t('refresh')}
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <Shield className="h-4 w-4" /> {t('kyc_section')}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={Shield} label={t('kyc_verified_today')} value={metrics.kycToday} color="blue" />
          <KpiCard icon={Users} label={t('kyc_approved')} value={metrics.kycVerified} sub={`${metrics.kycToday > 0 ? Math.round(metrics.kycVerified / metrics.kycToday * 100) : 0}% ${t('success_rate')}`} color="green" />
          <KpiCard icon={Users} label={t('kyc_rejected')} value={metrics.kycRejected} color="red" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <Phone className="h-4 w-4" /> {t('voice_section')}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={Phone} label={t('calls_today')} value={metrics.callsToday} color="purple" />
          <KpiCard icon={Users} label={t('calls_connected')} value={metrics.callsConnected} color="green" trend="up" />
          <KpiCard icon={DollarSign} label={t('commitments')} value={metrics.commitmentsToday} color="yellow" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <Building2 className="h-4 w-4" /> {t('reas_section')}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={DollarSign} label={t('reas_mrr')} value={`$${metrics.reasMrr.toLocaleString()}`} color="green" trend="up" />
          <KpiCard icon={Home} label={t('reas_subscriptions')} value={metrics.reasSubscriptions} color="blue" />
          <KpiCard icon={TrendingUp} label={t('reas_occupancy')} value={`${metrics.reasOccupancy}%`} color="purple" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <BarChart3 className="h-4 w-4" /> {t('esg_section')}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={Leaf} label={t('esg_avg')} value={`${metrics.esgAverage}/100`} color="green" />
          <KpiCard icon={Home} label={t('tours_active')} value={metrics.toursActive} color="blue" />
          <KpiCard icon={BarChart3} label={t('pending_reconciliation')} value={metrics.reconciliationPending} color="yellow" />
        </div>
      </div>
    </div>
  );
}
