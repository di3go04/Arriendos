'use client';

import type { ReadinessItem } from '@/config/readiness';
import { ArrowLeft,CheckCircle2,ClipboardCheck,RefreshCw,Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import PremiumImprovementsPanel from '@/components/admin/PremiumImprovementsPanel';
import ValuationCalculator from '@/components/admin/ValuationCalculator';

interface ReadinessResponse {
  generatedAt: string;
  score: number;
  summary: { done: number; needs_config: number; manual: number };
  env: Record<string, boolean>;
  items: ReadinessItem[];
}

const statusMeta = {
  done: { label: 'Listo', className: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  needs_config: { label: 'Configurar', className: 'bg-warning/10 text-warning border-warning/20', icon: Settings },
  manual: { label: 'Manual', className: 'bg-primary/10 text-primary border-primary/20', icon: ClipboardCheck },
};

export default function ReadinessPage() {
  const [data, setData] = useState<ReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReadiness = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/readiness');
      if (!res.ok) throw new Error('No se pudo cargar readiness');
      setData(await res.json());
    } catch {
      setError('No se pudo cargar el estado operativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReadiness();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-5 py-10 space-y-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
          <ArrowLeft className="w-4 h-4" />
          Volver a admin
        </Link>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
            {error}
          </div>
        )}

        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">Venta y produccion</p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2">Checklist de preparacion</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Estado de las 30 mejoras priorizadas para vender, operar y demostrar RentNow con confianza.
            </p>
            <Link
              href="/admin/mejoras-modulares"
              className="inline-flex mt-3 text-xs font-bold text-primary hover:underline"
            >
              Ver 9 mejoras modulares premium y valoración en USD →
            </Link>
          </div>
          <button
            onClick={loadReadiness}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </section>

        {data && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase">Score</p>
                <p className="text-4xl font-black text-foreground mt-1">{data.score}%</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase">Listas</p>
                <p className="text-4xl font-black text-success mt-1">{data.summary.done}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase">Requieren config</p>
                <p className="text-4xl font-black text-warning mt-1">{data.summary.needs_config}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase">Manual</p>
                <p className="text-4xl font-black text-primary mt-1">{data.summary.manual}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              {data.items.map((item) => {
                const meta = statusMeta[item.status];
                const Icon = meta.icon;
                return (
                  <div key={item.id} className="grid grid-cols-[48px_1fr_auto] gap-4 border-b border-border p-4 last:border-b-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-black">
                      {item.id}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.area} - {item.evidence}</p>
                    </div>
                    <span className={`h-fit inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </section>

            <section>
              <h2 className="text-lg font-black text-foreground mb-4">9 mejoras modulares (valor USD)</h2>
              <PremiumImprovementsPanel />
            </section>

            <ValuationCalculator initialScore={data.score} />
          </>
        )}
      </main>
    </div>
  );
}
