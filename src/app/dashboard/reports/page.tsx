'use client';

import { useAuth } from '@/context/AuthContext';
import { buildFinancialExportUrl } from '@/modules/finance-export/service';
import { Download, FileSpreadsheet, Loader2, TrendingUp } from 'lucide-react';
import { useState } from 'react';

/** Módulo 18 — reportes financieros exportables */
export default function FinanceReportsPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<LooseRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/financial?year=${year}`);
    const data = await res.json();
    setSummary(data);
    setLoading(false);
  };

  const exportExcel = () => {
    window.open(buildFinancialExportUrl(year), '_blank');
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Reportes financieros</h1>
        <p className="text-sm text-muted-foreground">Morosidad, proyección anual y exportación</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm font-semibold">
          Año
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="block mt-1 border rounded-lg px-3 py-2 w-28"
          />
        </label>
        <button
          type="button"
          onClick={loadSummary}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cargar resumen'}
        </button>
        <button
          type="button"
          onClick={exportExcel}
          className="px-4 py-2 border rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-5 rounded-2xl border bg-card">
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Eficiencia de cobro</p>
            <p className="text-2xl font-black">{summary.collectionEfficiency ?? '—'}%</p>
          </div>
          <div className="p-5 rounded-2xl border bg-card">
            <Download className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Proyección anual</p>
            <p className="text-2xl font-black">
              {summary.annualProjection != null
                ? `$${Number(summary.annualProjection).toLocaleString()}`
                : '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
