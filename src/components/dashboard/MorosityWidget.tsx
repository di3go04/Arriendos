'use client';

import { BrainCircuit, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MorosityData {
  rate: number;
  totalContracts: number;
  overdueCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'worsening';
}

export function MorosityWidget({ data }: { data: MorosityData }) {
  const [animatedRate, setAnimatedRate] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedRate(data.rate), 100);
    return () => clearTimeout(timer);
  }, [data.rate]);

  const colorMap = {
    low: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
    medium: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
    high: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  };

  const colors = colorMap[data.riskLevel];
  const barColor = data.rate < 5 ? 'bg-success' : data.rate < 15 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className={`rounded-2xl p-5 border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${colors.bg}`}>
            <BrainCircuit className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Morosidad</p>
            <p className="text-lg font-black text-foreground">{animatedRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${colors.text}`}>
          {data.trend === 'worsening' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {data.trend === 'improving' ? 'Mejorando' : data.trend === 'worsening' ? 'Empeorando' : 'Estable'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{data.overdueCount} de {data.totalContracts} contratos vencidos</span>
          <span className="font-bold text-foreground">{data.overdueCount > 0 ? 'Alerta' : 'Sin novedades'}</span>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
            style={{ width: `${Math.min(animatedRate, 100)}%` }}
          />
        </div>

        <p className="text-[10px] text-muted-foreground">
          {data.riskLevel === 'low' && 'Bajo riesgo de morosidad. Continúa así.'}
          {data.riskLevel === 'medium' && 'Riesgo moderado. Revisa los pagos pendientes.'}
          {data.riskLevel === 'high' && 'Alto riesgo de morosidad. Toma acción inmediata.'}
        </p>
      </div>
    </div>
  );
}
