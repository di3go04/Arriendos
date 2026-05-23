'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { formatCOP } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { format,parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
AlertTriangle,
CheckCircle2,
ChevronDown,
Clock,
Coins,
Eye,
Filter,
Loader2,
Receipt,
Search,
TrendingUp,
UploadCloud,
X
} from 'lucide-react';
import { useRef,useState } from 'react';
import { getPaymentStatus,PAYMENT_METHODS,STATUS_OPTS,usePayments } from './usePayments';

export default function PaymentsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const {
    filtered, contracts, properties, loading, isLandlord, today, totals, fetchData,
    search, setSearch, filterPropertyId, setFilterPropertyId, filterContractId, setFilterContractId,
    filterStatus, setFilterStatus, filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
  } = usePayments(user, profile);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Reconcile state
  const [reconcilePayment, setReconcilePayment] = useState<LooseRecord | null>(null);
  const [reconcileDate, setReconcileDate] = useState('');
  const [reconcileMethod, setReconcileMethod] = useState('Efectivo');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconciling, setReconciling] = useState(false);

  // Register state
  const [registerPayment, setRegisterPayment] = useState<LooseRecord | null>(null);
  const [registerMethod, setRegisterMethod] = useState('Transferencia Bancaria');
  const [registerFile, setRegisterFile] = useState<File | null>(null);
  const [registerUploading, setRegisterUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReconcile = async () => {
    if (!reconcilePayment || !reconcileDate) return;
    setReconciling(true);
    try {
      const { error } = await supabase.from('payments').update({
        paid: true, paid_at: new Date(reconcileDate).toISOString(),
        payment_method: reconcileMethod, notes: reconcileNotes || null
      }).eq('id', reconcilePayment.id);
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: reconcilePayment.tenant_id, contract_id: reconcilePayment.contract_id,
        type: 'pago_validado', title: 'Pago validado',
        message: `Tu pago de ${formatCOP(reconcilePayment.amount)} ha sido validado.`,
      });
      await supabase.functions.invoke('send-notification', {
        body: { type: 'pago_validado', userId: reconcilePayment.tenant_id, contractId: reconcilePayment.contract_id }
      }).catch(() => {});

      setSuccessMsg('Pago marcado como pagado exitosamente.');
      setReconcilePayment(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      toast({ type: 'error', message: 'Error al conciliar el pago.' });
    } finally { setReconciling(false); }
  };

  const handleRegisterPayment = async () => {
    if (!registerPayment || !registerFile) return;
    setRegisterUploading(true);
    try {
      const ext = registerFile.name.split('.').pop();
      const fileName = `receipt_${registerPayment.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('payment-receipts').upload(fileName, registerFile);
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('payment-receipts').getPublicUrl(fileName);

      const { error: updateErr } = await supabase.from('payments').update({
        payment_method: registerMethod, receipt_url: publicUrl
      }).eq('id', registerPayment.id);
      if (updateErr) throw updateErr;

      await supabase.from('notifications').insert({
        user_id: registerPayment.contract?.landlord_id, contract_id: registerPayment.contract_id,
        type: 'pago_registrado', title: 'Nuevo comprobante',
        message: `Se ha subido un comprobante de pago de ${formatCOP(registerPayment.amount)}.`,
      });
      await supabase.functions.invoke('send-notification', {
        body: { type: 'pago_registrado', userId: registerPayment.contract?.landlord_id, contractId: registerPayment.contract_id }
      }).catch(() => {});

      setSuccessMsg('Comprobante subido. En revisión.');
      setRegisterPayment(null);
      setRegisterFile(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      toast({ type: 'error', message: 'Error al registrar el pago.' });
    } finally { setRegisterUploading(false); }
  };

  if (!user || !profile || loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 bg-success text-success-foreground px-4 py-3 rounded-lg shadow-[0_25px_50px_rgba(0,0,0,0.15)] text-xs font-semibold flex items-center gap-2 animate-slide-in-right">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isLandlord ? 'Cobros y Conciliación' : 'Mis Pagos'}
        </h1>
        <p className="text-sm text-ink-muted">
          {isLandlord ? 'Gestiona el flujo de caja y valida los pagos de tus inquilinos.' : 'Historial de pagos y subida de comprobantes.'}
        </p>
      </div>

      {isLandlord && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-card border-none rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Cobrado</span>
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
            <div>
              <span className="block text-3xl font-extrabold tabular-nums text-foreground">{formatCOP(totals.paid)}</span>
              <span className="text-[11px] font-semibold text-ink-muted mt-1">Total recibido</span>
            </div>
          </div>
          <div className="bg-card border-none rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Pendiente</span>
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4 text-warning" />
              </div>
            </div>
            <div>
              <span className="block text-3xl font-extrabold tabular-nums text-foreground">{formatCOP(totals.pending)}</span>
              <span className="text-[11px] font-semibold text-ink-muted mt-1">Por cobrar</span>
            </div>
          </div>
          <div className="bg-card border-none rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Morosidad</span>
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <div>
              <span className="block text-3xl font-extrabold tabular-nums text-foreground">{formatCOP(totals.overdue)}</span>
              <span className="text-[11px] font-semibold text-ink-muted mt-1">{totals.morosity}% de los pendientes</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <input id="payment-search" name="paymentSearch"
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isLandlord ? 'Buscar por inquilino, propiedad...' : 'Buscar por propiedad...'}
              className="w-full bg-card border border-border text-foreground text-xs rounded-lg pl-9 p-2.5 outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>

          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-muted border border-border rounded-lg text-xs font-semibold text-foreground">
            <Filter className="w-4 h-4" /> Filtros <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-2`}>
            {isLandlord && (
              <>
                <select value={filterPropertyId} onChange={e => { setFilterPropertyId(e.target.value); setFilterContractId('all'); }} className="bg-card border border-border text-foreground text-xs font-medium rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring">
                  <option value="all">Todas las propiedades</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <select value={filterContractId} onChange={e => setFilterContractId(e.target.value)} className="bg-card border border-border text-foreground text-xs font-medium rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring">
                  <option value="all">Todos los contratos</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>#{c.contract_number || c.id.slice(0, 8)}</option>)}
                </select>
              </>
            )}
            <div className="flex bg-muted p-1 rounded-lg overflow-x-auto snap-x hide-scrollbar shrink-0 max-w-full">
              {STATUS_OPTS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setFilterStatus(o.value)}
                  className={`snap-center shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                    filterStatus === o.value
                      ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(37,99,235,0.2)] scale-100'
                      : 'bg-transparent text-ink-muted hover:text-foreground hover:bg-card/50 scale-95 hover:scale-100'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <input id="filter-date-from" name="filterDateFrom" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="bg-card border border-border text-foreground text-xs font-medium rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring" title="Desde" />
            <input id="filter-date-to" name="filterDateTo" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="bg-card border border-border text-foreground text-xs font-medium rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring" title="Hasta" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center bg-muted/30 border border-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center mb-5">
            <Receipt className="w-8 h-8 text-ink-muted" />
          </div>
          <h3 className="font-bold text-base text-foreground">No hay pagos</h3>
          <p className="text-xs text-ink-muted mt-1.5 font-medium">No se encontraron registros financieros con los filtros actuales.</p>
        </div>
      ) : (
        <div className="bg-card border-none rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted border-b border-border text-ink-secondary text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3">{isLandlord ? 'Inquilino' : 'Arrendador'}</th>
                  <th className="px-5 py-3">Propiedad & Contrato</th>
                  <th className="px-5 py-3">Mes</th>
                  <th className="px-5 py-3">Monto & Vencimiento</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => {
                  const status = getPaymentStatus(p, today);
                  const partner = isLandlord ? p.contract?.tenant : p.contract?.landlord;
                  return (
                    <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{partner?.full_name || '—'}</div>
                        <div className="text-[11px] text-ink-muted">{partner?.phone || 'Sin teléfono'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{p.contract?.property?.title || '—'}</div>
                        <div className="text-[10px] font-mono text-ink-muted">#{p.contract?.contract_number || p.contract_id?.slice(0, 8)}</div>
                      </td>
                      <td className="px-5 py-4 text-ink-secondary text-xs">{p.month_year || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold tabular-nums text-foreground">{formatCOP(p.amount)}</div>
                        <div className="text-[11px] text-ink-muted">{format(parseISO(p.due_date), 'dd/MMM/yyyy', { locale: es })}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold ${status.cls}`}>
                            {status.label}
                          </span>
                          {p.receipt_url && !p.paid && (
                            <span className="text-[10px] font-semibold text-warning">Comprobante en revisión</span>
                          )}
                          {p.receipt_url && p.paid && (
                            <button onClick={() => setReceiptPreview(p.receipt_url)} className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Ver recibo
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isLandlord && !p.paid ? (
                          <button onClick={() => { setReconcilePayment(p); setReconcileDate(format(today, 'yyyy-MM-dd')); setReconcileMethod('Efectivo'); setReconcileNotes(''); }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${p.receipt_url ? 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_2px_8px_rgba(37,99,235,0.2)]' : 'bg-success/10 border border-success/20 text-success hover:bg-success hover:text-success-foreground'}`}>
                            <Coins className="w-3.5 h-3.5" /> {p.receipt_url ? 'Validar recibo' : 'Marcar pagado'}
                          </button>
                        ) : !isLandlord && !p.paid && !p.receipt_url ? (
                          <button onClick={() => { setRegisterPayment(p); setRegisterMethod('Transferencia Bancaria'); setRegisterFile(null); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                            <UploadCloud className="w-3.5 h-3.5" /> Registrar pago
                          </button>
                        ) : (
                          <span className="text-[11px] text-ink-muted italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals go here, same logic but styled with standard variables */}
      {reconcilePayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setReconcilePayment(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-[0_25px_50px_rgba(0,0,0,0.15)] animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-success" /> Validar Pago
              </h3>
              <button onClick={() => setReconcilePayment(null)} className="p-1 rounded-md hover:bg-muted text-ink-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-muted border border-border rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-ink-muted">Inquilino:</span><span className="font-medium text-foreground">{reconcilePayment.contract?.tenant?.full_name}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Valor:</span><span className="font-bold tabular-nums text-foreground">{formatCOP(reconcilePayment.amount)}</span></div>
              </div>
              {reconcilePayment.receipt_url && (
                <button onClick={() => setReceiptPreview(reconcilePayment.receipt_url)} className="w-full py-2 bg-primary/5 border border-primary/20 rounded-lg text-xs font-medium text-primary flex justify-center items-center gap-2 hover:bg-primary/10 transition-colors">
                  <Eye className="w-4 h-4" /> Ver comprobante adjunto
                </button>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-secondary uppercase mb-1">Fecha de pago</label>
                  <input id="reconcile-date" name="reconcileDate" type="date" value={reconcileDate} onChange={e => setReconcileDate(e.target.value)} className="w-full bg-card border border-border rounded-md p-2 text-xs focus:ring-1 focus:ring-ring outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-secondary uppercase mb-1">Método</label>
                  <select value={reconcileMethod} onChange={e => setReconcileMethod(e.target.value)} className="w-full bg-card border border-border rounded-md p-2 text-xs focus:ring-1 focus:ring-ring outline-none">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-secondary uppercase mb-1">Notas (Opcional)</label>
                  <textarea value={reconcileNotes} onChange={e => setReconcileNotes(e.target.value)} className="w-full bg-card border border-border rounded-md p-2 text-xs focus:ring-1 focus:ring-ring outline-none" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setReconcilePayment(null)} className="px-4 py-2 text-xs font-medium text-ink-secondary border border-border rounded-md hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleReconcile} disabled={reconciling || !reconcileDate} className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-md shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-2">
                  {reconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {registerPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setRegisterPayment(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-[0_25px_50px_rgba(0,0,0,0.15)] animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-primary" /> Registrar Pago
              </h3>
              <button onClick={() => setRegisterPayment(null)} className="p-1 rounded-md hover:bg-muted text-ink-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-muted border border-border rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-ink-muted">Valor:</span><span className="font-bold tabular-nums text-foreground">{formatCOP(registerPayment.amount)}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Vencimiento:</span><span className="font-medium text-foreground">{format(parseISO(registerPayment.due_date), 'dd/MMM/yyyy')}</span></div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-secondary uppercase mb-1">Método</label>
                  <select value={registerMethod} onChange={e => setRegisterMethod(e.target.value)} className="w-full bg-card border border-border rounded-md p-2 text-xs focus:ring-1 focus:ring-ring outline-none">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-secondary uppercase mb-1">Comprobante</label>
                  <div onClick={() => fileInputRef.current?.click()} className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${registerFile ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                    {registerFile ? (
                      <div className="space-y-1">
                        <CheckCircle2 className="w-6 h-6 mx-auto text-success" />
                        <p className="text-xs font-medium text-foreground">{registerFile.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); setRegisterFile(null); }} className="text-[10px] text-destructive hover:underline">Quitar</button>
                      </div>
                    ) : (
                      <div className="space-y-1 text-ink-muted">
                        <UploadCloud className="w-6 h-6 mx-auto" />
                        <p className="text-xs">Click para subir (PDF, JPG, PNG)</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={e => setRegisterFile(e.target.files?.[0] || null)} className="hidden" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setRegisterPayment(null)} className="px-4 py-2 text-xs font-medium text-ink-secondary border border-border rounded-md hover:bg-muted transition-colors">Cancelar</button>
                <button onClick={handleRegisterPayment} disabled={registerUploading || !registerFile} className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-md shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-2">
                  {registerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />} Subir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {receiptPreview && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setReceiptPreview(null)}>
          <div className="relative max-w-2xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReceiptPreview(null)} className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            {receiptPreview.endsWith('.pdf') ? (
              <iframe src={receiptPreview} className="w-full h-[80vh] rounded-xl bg-card border border-border" />
            ) : (
              <img src={receiptPreview} alt="Comprobante" className="w-full rounded-xl shadow-2xl border border-border" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
