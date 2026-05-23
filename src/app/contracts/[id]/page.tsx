'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { addDays,differenceInCalendarDays,differenceInDays,format,parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
AlertTriangle,ArrowLeft,
Ban,
Building2,
Calendar,
Check,
CheckCircle2,
Clock,
DollarSign,
Download,
Eye,
FileSignature,
FileText,
Loader2,
MapPin,
RefreshCw,
ShieldCheck,
StickyNote,
UploadCloud,
User,
XCircle
} from 'lucide-react';
import { useParams,useRouter } from 'next/navigation';
import React,{ useEffect,useState } from 'react';

import { formatCOP } from '@/lib/format';

const statusConfig: Record<string, { label: string; cls: string }> = {
  borrador: { label: 'Borrador', cls: 'bg-muted border-border text-muted-foreground' },
  pendiente_firma: { label: 'Pendiente de Firma', cls: 'bg-amber-500/10 border-amber-500/25 text-amber-500' },
  firmado: { label: 'Firmado', cls: 'bg-blue-500/10 border-blue-500/25 text-blue-500' },
  activo: { label: 'Activo', cls: 'bg-slate-100 border-slate-200 text-slate-700' },
  finalizado: { label: 'Finalizado', cls: 'bg-slate-500/10 border-slate-500/25 text-slate-500' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-50 border-red-200 text-red-600' },
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [contract, setContract] = useState<LooseRecord | null>(null);
  const [payments, setPayments] = useState<LooseRecord[]>([]);
  const [documents, setDocuments] = useState<LooseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [tab, setTab] = useState<'resumen' | 'pagos' | 'documentos' | 'historial'>('resumen');
  const [actionLoading, setActionLoading] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit notes
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!params?.id || !user || !profile) return;
    fetchData();
  }, [params.id, user, profile]);

  const fetchData = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const { data: c, error } = await supabase
        .from('contracts')
        .select(`
          *,
          property:properties (*),
          landlord:profiles!contracts_landlord_id_fkey (id, full_name, phone, email, role),
          tenant:profiles!contracts_tenant_id_fkey (id, full_name, phone, email, role)
        `)
        .eq('id', params.id)
        .single();
      if (error) throw error;

      // Access check
      const isLandlord = c.landlord_id === user.id;
      const isTenant = c.tenant_id === user.id;
      if (!isLandlord && !isTenant) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setContract(c);
      setNotes(c.notes || '');

      // Payments
      const { data: pays } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', params.id)
        .order('due_date', { ascending: false });
      setPayments(pays || []);

      // Documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*, uploader:profiles!documents_uploaded_by_fkey (id, full_name)')
        .eq('contract_id', params.id)
        .order('created_at', { ascending: false });
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error fetching contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'finalizar' | 'cancelar' | 'renovar') => {
    if (!contract) return;
    setActionLoading(action);
    try {
      const updates: LooseRecord = {};
      if (action === 'finalizar') updates.status = 'finalizado';
      if (action === 'cancelar') updates.status = 'cancelado';
      if (action === 'renovar') {
        // Clone contract with new dates
        const newStart = addDays(new Date(), 1).toISOString().split('T')[0];
        const newEnd = contract.end_date
          ? addDays(parseISO(contract.end_date), differenceInDays(parseISO(contract.end_date), parseISO(contract.start_date))).toISOString().split('T')[0]
          : addDays(new Date(), 365).toISOString().split('T')[0];
        const { error: insertErr } = await supabase.from('contracts').insert({
          property_id: contract.property_id,
          landlord_id: contract.landlord_id,
          tenant_id: contract.tenant_id,
          template_id: contract.template_id,
          start_date: newStart,
          end_date: newEnd,
          monthly_rent: contract.monthly_rent,
          deposit: contract.deposit,
          payment_day: contract.payment_day,
          contract_content: contract.contract_content,
          status: 'pendiente_firma',
        });
        if (insertErr) throw insertErr;
        setSuccessMsg('Contrato renovado. La nueva versión está pendiente de firma.');
        setTimeout(() => router.push('/dashboard/leases'), 2000);
        return;
      }

      const { error } = await supabase.from('contracts').update(updates).eq('id', contract.id);
      if (error) throw error;

      setSuccessMsg(`Contrato ${action === 'finalizar' ? 'finalizado' : 'cancelado'} exitosamente.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating contract:', err);
    } finally {
      setActionLoading('');
    }
  };

  const saveNotes = async () => {
    if (!params?.id) return;
    setSavingNotes(true);
    try {
      await supabase.from('contracts').update({ notes }).eq('id', params.id);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handlePrint = () => {
    if (!contract?.contract_content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><style>
        body { font-family: 'Outfit', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
        @media print { body { padding: 0; } }
      </style></head><body>${contract.contract_content}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  // Timeline
  const buildTimeline = () => {
    if (!contract) return [];
    const events: { date: string; type: string; title: string; desc: string; icon: LooseValue; cls: string }[] = [];

    // Created
    events.push({
      date: contract.created_at,
      type: 'created',
      title: 'Contrato creado',
      desc: `Número: #${contract.contract_number || contract.id.slice(0, 8)}`,
      icon: FileText,
      cls: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    });

    // Landlord signed
    if (contract.signed_by_landlord && contract.landlord_signed_at) {
      events.push({
        date: contract.landlord_signed_at,
        type: 'landlord_signed',
        title: 'Firma del arrendador',
        desc: `${contract.landlord?.full_name || 'Arrendador'} firmó el contrato.`,
        icon: FileSignature,
        cls: 'text-blue-600 bg-blue-50 border-blue-200',
      });
    }

    // Tenant signed
    if (contract.signed_by_tenant && contract.tenant_signed_at) {
      events.push({
        date: contract.tenant_signed_at,
        type: 'tenant_signed',
        title: 'Firma del arrendatario',
        desc: `${contract.tenant?.full_name || 'Arrendatario'} firmó el contrato.`,
        icon: CheckCircle2,
        cls: 'text-blue-600 bg-blue-50 border-blue-200',
      });
    }

    // Status changes
    if (contract.status === 'activo') {
      events.push({
        date: contract.tenant_signed_at || contract.landlord_signed_at || contract.created_at,
        type: 'activated',
        title: 'Contrato activado',
        desc: 'El contrato está en vigor.',
        icon: ShieldCheck,
        cls: 'text-blue-600 bg-blue-50 border-blue-200',
      });
    }
    if (contract.status === 'finalizado') {
      events.push({
        date: new Date().toISOString(),
        type: 'finalized',
        title: 'Contrato finalizado',
        desc: 'El contrato ha llegado a su término.',
        icon: Ban,
        cls: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
      });
    }
    if (contract.status === 'cancelado') {
      events.push({
        date: new Date().toISOString(),
        type: 'cancelled',
        title: 'Contrato cancelado',
        desc: 'El contrato fue cancelado.',
        icon: XCircle,
        cls: 'text-red-600 bg-red-50 border-red-200',
      });
    }

    // Payments
    for (const p of payments) {
      events.push({
        date: p.paid ? (p.paid_at || p.due_date) : p.due_date,
        type: 'payment',
        title: p.paid ? 'Pago realizado' : 'Pago programado',
        desc: `${formatCOP(p.amount)} — ${p.paid ? 'Pagado' : 'Pendiente'}${p.payment_method ? ` (${p.payment_method})` : ''}`,
        icon: p.paid ? DollarSign : Clock,
        cls: p.paid ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      });
    }

    // Documents
    for (const d of documents) {
      events.push({
        date: d.created_at,
        type: 'document',
        title: `Documento subido: ${d.name || 'Sin nombre'}`,
        desc: `Tipo: ${d.type} — ${d.uploader?.full_name || 'Desconocido'}`,
        icon: FileText,
        cls: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accessDenied || !contract) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-red-600" />
        <p className="text-sm font-bold text-muted-foreground">Acceso denegado</p>
        <button onClick={() => router.push('/dashboard/leases')} className="text-xs text-primary font-bold hover:underline cursor-pointer">Volver</button>
      </div>
    );
  }

  const timeline = buildTimeline();
  const sc = statusConfig[contract.status] || statusConfig.borrador;
  const remainingDays = contract.end_date ? differenceInCalendarDays(parseISO(contract.end_date), new Date()) : null;
  const totalPaid = payments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);
  const nextPayment = payments.filter(p => !p.paid).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in">

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              Contrato #{contract.contract_number || contract.id.slice(0, 8)}
              <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>
                {sc.label}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{contract.property?.title} — {contract.property?.city || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={!contract.contract_content}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          {contract.status === 'activo' && remainingDays !== null && remainingDays <= 30 && remainingDays >= 0 && (
            <button
              onClick={() => handleAction('renovar')}
              disabled={actionLoading === 'renovar'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {actionLoading === 'renovar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Renovar
            </button>
          )}
          {(contract.status === 'activo' || contract.status === 'firmado') && (
            <button
              onClick={() => handleAction('finalizar')}
              disabled={actionLoading === 'finalizar'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {actionLoading === 'finalizar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              Finalizar
            </button>
          )}
          {(contract.status === 'borrador' || contract.status === 'pendiente_firma') && (
            <button
              onClick={() => handleAction('cancelar')}
              disabled={actionLoading === 'cancelar'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {actionLoading === 'cancelar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {(['resumen', 'pagos', 'documentos', 'historial'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            {t === 'resumen' && <FileText className="w-4 h-4" />}
            {t === 'pagos' && <DollarSign className="w-4 h-4" />}
            {t === 'documentos' && <FileText className="w-4 h-4" />}
            {t === 'historial' && <Clock className="w-4 h-4" />}
            {t === 'resumen' && 'Resumen'}
            {t === 'pagos' && 'Pagos'}
            {t === 'documentos' && 'Documentos'}
            {t === 'historial' && 'Historial'}
          </button>
        ))}
      </div>

      {/* ============ TAB: RESUMEN ============ */}
      {tab === 'resumen' && (
        <div className="space-y-6">

          {/* Main info grid */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-foreground mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Información del Contrato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <InfoItem icon={FileText} label="Número" value={`#${contract.contract_number || contract.id.slice(0, 8)}`} />
              <InfoItem icon={Building2} label="Propiedad" value={
                <button onClick={() => router.push(`/properties/${contract.property_id}`)} className="text-primary font-bold hover:underline cursor-pointer text-left">
                  {contract.property?.title || '—'}
                </button>
              } />
              <InfoItem icon={MapPin} label="Dirección" value={`${contract.property?.address || ''}${contract.property?.city ? `, ${contract.property.city}` : ''}`} />
              <InfoItem icon={User} label="Arrendador" value={
                <span>
                  <span className="block font-bold">{contract.landlord?.full_name || '—'}</span>
                  <span className="block text-[10px] text-muted-foreground">{contract.landlord?.phone || ''}</span>
                </span>
              } />
              <InfoItem icon={User} label="Arrendatario" value={
                <span>
                  <span className="block font-bold">{contract.tenant?.full_name || '—'}</span>
                  <span className="block text-[10px] text-muted-foreground">{contract.tenant?.phone || ''}{contract.tenant?.email ? ` · ${contract.tenant.email}` : ''}</span>
                </span>
              } />
              <InfoItem icon={DollarSign} label="Renta Mensual" value={formatCOP(contract.monthly_rent)} />
              <InfoItem icon={DollarSign} label="Depósito" value={formatCOP(contract.deposit)} />
              <InfoItem icon={Calendar} label="Fecha de Inicio" value={contract.start_date ? format(parseISO(contract.start_date), 'dd/MMM/yyyy', { locale: es }) : '—'} />
              <InfoItem icon={Calendar} label="Fecha de Fin" value={contract.end_date ? format(parseISO(contract.end_date), 'dd/MMM/yyyy', { locale: es }) : 'Indefinido'} />
              <InfoItem icon={Calendar} label="Día de Pago" value={`Día ${contract.payment_day} de cada mes`} />
            </div>
          </div>

          {/* Signature progress */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-foreground mb-5 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-primary" />
              Progreso de Firmas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-foreground">Arrendador</span>
                  </div>
                  {contract.signed_by_landlord ? (
                    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Firmado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                </div>
                {contract.landlord_signed_at && (
                  <p className="text-[10px] text-muted-foreground">{format(parseISO(contract.landlord_signed_at), 'dd/MMM/yyyy HH:mm', { locale: es })}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-foreground">Arrendatario</span>
                  </div>
                  {contract.signed_by_tenant ? (
                    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Firmado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                </div>
                {contract.tenant_signed_at && (
                  <p className="text-[10px] text-muted-foreground">{format(parseISO(contract.tenant_signed_at), 'dd/MMM/yyyy HH:mm', { locale: es })}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active counter */}
          {contract.status === 'activo' && remainingDays !== null && (
            <div className={`rounded-3xl p-6 shadow-sm border ${
              remainingDays <= 30
                ? 'bg-amber-500/5 border-amber-500/20'
                : remainingDays <= 0
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    remainingDays <= 30 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-50 border-blue-200 text-blue-600'
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-2xl font-extrabold text-foreground">{remainingDays > 0 ? `${remainingDays} días` : 'Vencido'}</span>
                    <span className="block text-[11px] font-bold text-muted-foreground">
                      {remainingDays > 0 ? 'restantes hasta el fin del contrato' : 'El contrato ha vencido'}
                    </span>
                  </div>
                </div>
                {remainingDays <= 30 && remainingDays > 0 && (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                    Próximo a vencer
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-foreground mb-4 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              Notas del Contrato
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Añade notas compartidas sobre este contrato..."
              rows={4}
              className="w-full bg-muted border border-border text-foreground text-sm rounded-2xl p-4 outline-none resize-y focus:ring-1 focus:ring-ring"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Guardar notas
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ============ TAB: PAGOS ============ */}
      {tab === 'pagos' && (
        <div className="space-y-6">

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Pagado</span>
              <span className="block text-xl font-extrabold text-foreground mt-1">{formatCOP(totalPaid)}</span>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pendiente</span>
              <span className="block text-xl font-extrabold text-foreground mt-1">{formatCOP(totalPending)}</span>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Próximo Pago</span>
              <span className="block text-xl font-extrabold text-foreground mt-1">
                {nextPayment ? formatCOP(nextPayment.amount) : '—'}
              </span>
              {nextPayment && (
                <span className="block text-[10px] text-muted-foreground mt-0.5">
                  Vence: {format(parseISO(nextPayment.due_date), 'dd/MMM/yyyy', { locale: es })}
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          {payments.length === 0 ? (
            <div className="py-10 text-center bg-card border border-dashed border-border rounded-3xl">
              <DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs font-bold text-muted-foreground">Sin pagos registrados</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                      <th className="px-5 py-4">Mes</th>
                      <th className="px-5 py-4">Monto</th>
                      <th className="px-5 py-4">Vencimiento</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Pagado el</th>
                      <th className="px-5 py-4">Método</th>
                      <th className="px-5 py-4">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-4 font-semibold text-foreground">{p.month_year || '—'}</td>
                        <td className="px-5 py-4 font-extrabold text-foreground">{formatCOP(p.amount)}</td>
                        <td className="px-5 py-4 text-muted-foreground">{format(parseISO(p.due_date), 'dd/MMM/yyyy', { locale: es })}</td>
                        <td className="px-5 py-4">
                          {p.paid ? (
                            <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Pagado
                            </span>
                          ) : new Date(p.due_date) < new Date() ? (
                            <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Vencido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{p.paid_at ? format(parseISO(p.paid_at), 'dd/MMM/yyyy', { locale: es }) : '—'}</td>
                        <td className="px-5 py-4 text-muted-foreground">{p.payment_method || '—'}</td>
                        <td className="px-5 py-4">
                          {p.receipt_url ? (
                            <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-[10px] hover:underline flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Ver
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: DOCUMENTOS ============ */}
      {tab === 'documentos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => router.push(`/contracts/${contract.id}/documents`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 text-xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Ir a Documentos
            </button>
          </div>
          {documents.length === 0 ? (
            <div className="py-10 text-center bg-card border border-dashed border-border rounded-3xl">
              <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs font-bold text-muted-foreground">Sin documentos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(d => (
                <div key={d.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border mb-3 ${
                    d.type === 'inventario' ? 'bg-blue-500/10 border-blue-500/25 text-blue-500' :
                    d.type === 'foto' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                    d.type === 'anexo' ? 'bg-amber-500/10 border-amber-500/25 text-amber-500' :
                    'bg-muted border-border text-muted-foreground'
                  }`}>
                    {d.type === 'inventario' ? 'Inventario' : d.type === 'foto' ? 'Foto' : d.type === 'anexo' ? 'Anexo' : 'Otro'}
                  </span>
                  <h4 className="font-bold text-sm text-foreground mb-2 break-words">{d.name || 'Documento'}</h4>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    <p>{format(parseISO(d.created_at), 'dd/MMM/yyyy', { locale: es })}</p>
                    <p>{d.uploader?.full_name || '—'}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white text-[10px] font-bold transition-all cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: HISTORIAL ============ */}
      {tab === 'historial' && (
        <div>
          {timeline.length === 0 ? (
            <div className="py-10 text-center bg-card border border-dashed border-border rounded-3xl">
              <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs font-bold text-muted-foreground">Sin eventos registrados</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />

              <div className="space-y-0">
                {timeline.map((ev, i) => {
                  const Icon = ev.icon;
                  return (
                    <div key={i} className="relative flex items-start gap-5 pb-8 last:pb-0">
                      {/* Dot */}
                      <div className={`relative z-10 p-2 rounded-xl border shrink-0 ${ev.cls}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-extrabold text-foreground">{ev.title}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{ev.desc}</p>
                        <span className="text-[9px] font-bold text-muted-foreground mt-1 block">
                          {format(parseISO(ev.date), 'dd/MMM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: LooseValue; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 text-primary shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="block text-sm font-bold text-foreground mt-0.5 break-words">{value}</span>
      </div>
    </div>
  );
}
