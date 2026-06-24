'use client';

import { CheckCircle2, DollarSign, Hammer, Layers, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ImprovementRow {
  id: string;
  order: number;
  title: string;
  description: string;
  modulePath: string;
  apiEvidence?: string;
  status: 'implemented' | 'partial' | 'pending';
  checks: { label: string; ok: boolean }[];
  saleValueAddedUsd: number;
  saleValueUnlockedUsd: number;
  implementationCostUsd: number;
  implementationHours: number;
}

interface ApiResponse {
  generatedAt: string;
  summary: {
    baseSaleValueUsd: number;
    totalSaleValueAddedUsd: number;
    totalSaleValueUnlockedUsd: number;
    estimatedSalePriceUsd: number;
    totalImplementationCostUsd: number;
    totalImplementationHours: number;
    implementedCount: number;
    partialCount: number;
    pendingCount: number;
    completionPercent: number;
  };
  items: ImprovementRow[];
}

const statusStyles = {
  implemented: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  partial: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  pending: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const statusLabels = {
  implemented: 'Implementada',
  partial: 'Parcial',
  pending: 'Pendiente',
};

export default function PremiumImprovementsPanel() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules/premium-improvements/status')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400 text-sm">
        Cargando valoración modular…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300 text-sm">
        No se pudo cargar el estado de las 9 mejoras modulares.
      </div>
    );
  }

  const { summary, items } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Valor venta estimado
          </div>
          <p className="text-2xl font-black text-white mt-2 tabular-nums">
            USD ${summary.estimatedSalePriceUsd.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Base ${summary.baseSaleValueUsd.toLocaleString()} + desbloqueado ${summary.totalSaleValueUnlockedUsd.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5" />
            Añade al vender (9/9)
          </div>
          <p className="text-2xl font-black text-white mt-2 tabular-nums">
            +USD ${summary.totalSaleValueAddedUsd.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Desbloqueado hoy: +${summary.totalSaleValueUnlockedUsd.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <Hammer className="w-3.5 h-3.5" />
            Costo implementación total
          </div>
          <p className="text-2xl font-black text-white mt-2 tabular-nums">
            USD ${summary.totalImplementationCostUsd.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{summary.totalImplementationHours} horas (~$50/h)</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            Completitud modular
          </div>
          <p className="text-2xl font-black text-white mt-2">{summary.completionPercent}%</p>
          <p className="text-[10px] text-slate-500 mt-1">
            {summary.implementedCount} listas · {summary.partialCount} parciales · {summary.pendingCount} pendientes
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">9 mejoras modulares premium</h3>
          <span className="text-[10px] text-slate-500">Actualizado {new Date(data.generatedAt).toLocaleString('es-CO')}</span>
        </div>
        <div className="divide-y divide-slate-800">
          {items.map((item) => (
            <div key={item.id} className="p-5 hover:bg-slate-900/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex gap-3 min-w-0">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center">
                    {item.order}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyles[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    <p className="text-[10px] text-slate-600 mt-1 font-mono">{item.modulePath}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {item.checks.map((c) => (
                        <li
                          key={c.label}
                          className={`text-[9px] px-2 py-0.5 rounded-md border ${
                            c.ok ? 'border-emerald-500/20 text-emerald-500/80' : 'border-slate-700 text-slate-600'
                          }`}
                        >
                          {c.ok ? '✓' : '○'} {c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end lg:text-right flex-shrink-0">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Añade al vender</span>
                    <span className="text-sm font-black text-emerald-400 tabular-nums">
                      +USD ${item.saleValueAddedUsd.toLocaleString()}
                    </span>
                    {item.saleValueUnlockedUsd > 0 && item.saleValueUnlockedUsd < item.saleValueAddedUsd && (
                      <span className="text-[10px] text-amber-400 block">
                        Desbloqueado: +${item.saleValueUnlockedUsd.toLocaleString()}
                      </span>
                    )}
                    {item.status === 'implemented' && (
                      <span className="text-[10px] text-emerald-500/70 flex items-center gap-1 justify-end mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Costo implementar</span>
                    <span className="text-sm font-bold text-amber-300/90 tabular-nums">
                      USD ${item.implementationCostUsd.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-600 block">{item.implementationHours}h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4 text-sm text-indigo-200/90">
        <strong className="text-indigo-300">Resumen financiero:</strong> Si implementas las 9 mejoras al 100%, el precio de venta del código pasa de{' '}
        <strong>USD ${summary.baseSaleValueUsd.toLocaleString()}</strong> a aproximadamente{' '}
        <strong>USD ${(summary.baseSaleValueUsd + summary.totalSaleValueAddedUsd).toLocaleString()}</strong>{' '}
        (+${summary.totalSaleValueAddedUsd.toLocaleString()}). El costo total estimado de desarrollo es{' '}
        <strong>USD ${summary.totalImplementationCostUsd.toLocaleString()}</strong> ({summary.totalImplementationHours} horas).
        ROI de valor vs costo:{' '}
        <strong>
          {Math.round((summary.totalSaleValueAddedUsd / summary.totalImplementationCostUsd) * 100) / 100}x
        </strong>
        .
      </div>
    </div>
  );
}
