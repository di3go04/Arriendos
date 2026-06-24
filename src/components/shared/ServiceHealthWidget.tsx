'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, Database, Mail, CreditCard, MessageSquare, Activity } from 'lucide-react';

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'not_configured';
  latency?: number;
  error?: string;
}

interface HealthData {
  status: 'operational' | 'degraded';
  uptime: number;
  timestamp: string;
  latency: number;
  services: {
    database: ServiceStatus;
    email: ServiceStatus;
    payments: ServiceStatus;
    whatsapp: ServiceStatus;
  };
}

export default function ServiceHealthWidget() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching API health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping relative inline-flex" />;
      case 'degraded':
        return <span className="w-2.5 h-2.5 rounded-full bg-destructive relative inline-flex" />;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 relative inline-flex" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted w-1/3 rounded-lg" />
          <div className="h-4 bg-muted w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const services = [
    {
      key: 'database',
      name: 'Supabase DB',
      icon: Database,
      info: data?.services?.database,
    },
    {
      key: 'payments',
      name: 'Mercado Pago',
      icon: CreditCard,
      info: data?.services?.payments,
    },
    {
      key: 'email',
      name: 'Resend Email',
      icon: Mail,
      info: data?.services?.email,
    },
    {
      key: 'whatsapp',
      name: 'WhatsApp Bridge',
      icon: MessageSquare,
      info: data?.services?.whatsapp,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <h3 className="font-extrabold text-foreground text-sm leading-tight">Estado de Integraciones</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 flex items-center gap-1">
              Latencia API: <span className="font-bold text-foreground">{data?.latency || 0}ms</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={refreshing}
          className="p-2 bg-muted hover:bg-border rounded-xl transition-all cursor-pointer border-none flex items-center justify-center"
          title="Refrescar estado"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-3">
        {services.map((srv) => {
          const Icon = srv.icon;
          const status = srv.info?.status || 'not_configured';
          const latency = srv.info?.latency;
          
          return (
            <div
              key={srv.key}
              className={`p-3.5 rounded-2xl border transition-all ${
                status === 'operational'
                  ? 'bg-emerald-500/[0.02] border-emerald-500/10 hover:border-emerald-500/20'
                  : status === 'degraded'
                  ? 'bg-red-500/[0.02] border-red-500/10 hover:border-red-500/20'
                  : 'bg-muted/40 border-border hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    status === 'operational'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : status === 'degraded'
                      ? 'bg-red-500/10 text-red-600'
                      : 'bg-muted border border-border text-muted-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-foreground truncate">{srv.name}</span>
                    <span className="block text-[9px] text-muted-foreground font-semibold mt-0.5">
                      {status === 'operational'
                        ? latency ? `${latency}ms` : 'Operativo'
                        : srv.info?.error ? 'Inactivo' : 'No configurado'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0">
                  {getStatusIcon(status)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Status Banner */}
      <div className={`p-3 rounded-2xl border flex items-center justify-between text-[10px] font-bold ${
        data?.status === 'operational'
          ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'
          : 'bg-amber-500/5 border-amber-500/10 text-amber-600'
      }`}>
        <span className="flex items-center gap-1">
          {data?.status === 'operational' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Sistemas 100% Operacionales
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Algunas integraciones requieren atención
            </>
          )}
        </span>
        <span className="text-muted-foreground font-mono text-[9px]">Uptime: {Math.round(data?.uptime || 0)}s</span>
      </div>
    </div>
  );
}
