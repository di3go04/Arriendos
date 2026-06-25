'use client';

import { useEffect, useState } from 'react';
import { Leaf, Award, TrendingDown } from 'lucide-react';

interface EsgData {
  overallScore: number;
  carbonFootprintKg: number;
  certification: string;
  energyScore: number;
  waterScore: number;
}

export function EsgBadge({ propertyId, compact = false }: { propertyId: string; compact?: boolean }) {
  const [data, setData] = useState<EsgData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/modules/esg-sustainability/score?propertyId=${propertyId}`)
      .then(r => r.json())
      .then(res => { if (res.ok) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />;
  if (!data) return null;

  const scoreColor = data.overallScore >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-950/30' 
    : data.overallScore >= 60 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30'
    : 'text-red-600 bg-red-50 dark:bg-red-950/30';
  const barColor = data.overallScore >= 80 ? 'bg-green-500' : data.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${scoreColor}`}>
        <Leaf className="h-3.5 w-3.5" />
        <span>{data.overallScore}/100</span>
        {data.certification !== 'ninguna' && (
          <span className="ml-1 rounded-md bg-white/60 px-1 font-mono text-[10px] uppercase dark:bg-black/30">
            {data.certification}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Leaf className="h-4 w-4 text-green-600" />
          Desempeño ESG
        </h3>
        {data.certification !== 'ninguna' && (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30">
            <Award className="h-3.5 w-3.5" />
            {data.certification.toUpperCase()}
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{data.overallScore}</span>
          <span className="text-xs text-zinc-500">/ 100</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${data.overallScore}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="font-medium">{data.energyScore}</p>
          <p className="text-zinc-500">Energía</p>
        </div>
        <div>
          <p className="font-medium">{data.waterScore}</p>
          <p className="text-zinc-500">Agua</p>
        </div>
        <div>
          <p className="font-medium">{data.carbonFootprintKg.toLocaleString()}</p>
          <p className="text-zinc-500">kg CO₂/año</p>
        </div>
      </div>

      {data.carbonFootprintKg > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <TrendingDown className="h-3 w-3" />
          <span>Huella de carbono estimada del inmueble</span>
        </div>
      )}
    </div>
  );
}
