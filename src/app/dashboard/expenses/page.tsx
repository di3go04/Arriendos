'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';
import { format,parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
DollarSign,
Landmark,
Loader2,
MoreHorizontal,
Plus,
Shield,
Trash2,
TrendingDown,
Wrench,Zap,
Download,
} from 'lucide-react';
import { useEffect,useState } from 'react';

const categoryIcons: Record<string, React.ElementType> = {
  maintenance: Wrench,
  utilities: Zap,
  taxes: Landmark,
  insurance: Shield,
  other: MoreHorizontal,
};

const categoryLabels: Record<string, string> = {
  maintenance: 'Mantenimiento',
  utilities: 'Servicios Públicos',
  taxes: 'Impuestos',
  insurance: 'Seguros',
  other: 'Otros',
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<LooseRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState<LooseRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    property_id: '', category: 'maintenance', amount: '', description: '', expense_date: '',
  });

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error('Error al cargar gastos');
      const data = await res.json();
      setExpenses(data.expenses || []);
      setSummary(data.summary);
    } catch {
      setErrorMsg('Error al cargar gastos.');
    }
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      try {
        const { data: props, error } = await supabase.from('properties').select('*').eq('owner_id', user.id);
        if (error) throw error;
        setProperties(props || []);
        await fetchExpenses();
      } catch {
        setErrorMsg('Error al cargar propiedades.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error('Error al guardar gasto');
      setShowForm(false);
      setForm({ property_id: '', category: 'maintenance', amount: '', description: '', expense_date: '' });
      await fetchExpenses();
    } catch {
      setErrorMsg('Error al guardar el gasto.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar gasto');
      await fetchExpenses();
    } catch {
      setErrorMsg('Error al eliminar el gasto.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
          <p className="text-sm text-muted-foreground">Registra y controla los gastos de tus propiedades</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/reports/export-excel"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-sm shadow-emerald-600/10 border-none"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
          {errorMsg}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(summary.totalByCategory || {}).map(([cat, total]: LooseValue) => {
            const Icon = categoryIcons[cat] || DollarSign;
            return (
              <div key={cat} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{categoryLabels[cat]}</span>
                </div>
                <p className="text-lg font-bold text-foreground">${Number(total).toLocaleString('es-CO')}</p>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Propiedad</label>
              <select
                value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Seleccionar propiedad</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Monto</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Fecha</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2.5 bg-foreground text-background text-sm font-bold rounded-xl hover:opacity-90 cursor-pointer border-none">
              Guardar Gasto
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-border text-sm font-bold rounded-xl hover:bg-muted cursor-pointer bg-transparent">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="font-semibold text-foreground">No hay gastos registrados</p>
          <p className="text-sm text-muted-foreground">Comienza registrando los gastos de tus propiedades.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase">Propiedad</th>
                  <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase">Categoría</th>
                  <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase">Descripción</th>
                  <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase">Fecha</th>
                  <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase">Monto</th>
                  <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((e: LooseValue) => (
                  <tr key={e.id} className="hover:bg-muted/50 transition-colors text-sm">
                    <td className="p-4 font-medium text-foreground">{e.property?.title || '—'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                        {categoryLabels[e.category] || e.category}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground max-w-[200px] truncate">{e.description || '—'}</td>
                    <td className="p-4 text-muted-foreground">
                      {e.expense_date ? format(parseISO(e.expense_date), 'dd/MMM/yyyy', { locale: es }) : '—'}
                    </td>
                    <td className="p-4 font-bold text-foreground">${Number(e.amount).toLocaleString('es-CO')}</td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
