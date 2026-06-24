'use client';

import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Contract } from '@/types';
import { format,getDaysInMonth,parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
AlertTriangle,
Building2,
Calendar,
Check,
CheckCircle2,
ChevronLeft,
DollarSign,
FileSignature,
Loader2,
MapPin,
PenLine,
Receipt,
ShieldCheck,
User,
X
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useParams,useRouter } from 'next/navigation';
import React,{ useCallback,useEffect,useRef,useState } from 'react';

import { useTranslations } from 'next-intl';
import { formatCOP } from '@/lib/format';

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('contract_sign');

  const [contract, setContract] = useState<Contract | null>(null);
  const [landlordName, setLandlordName] = useState('');
  const [propertyTitle, setPropertyTitle] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signMethod, setSignMethod] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [signed, setSigned] = useState(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (!params?.id || !user) return;
    const fetchContract = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            *,
            property:properties (*),
            landlord:profiles!contracts_landlord_id_fkey (*),
            tenant:profiles!contracts_tenant_id_fkey (*)
          `)
          .eq('id', params.id)
          .single();
        if (error) throw error;
        setContract(data);
        setLandlordName(data.landlord?.full_name || 'Arrendador');
        setPropertyTitle(data.property?.title || 'Propiedad');
        setPropertyAddress([data.property?.address, data.property?.city].filter(Boolean).join(', ') || '—');
      } catch (err) {
        console.error('Error fetching contract:', err);
        toast({ type: 'error', message: t('error_load') });
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user]);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctxRef.current = ctx;
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  }, []);

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getSignatureData = (): string | null => {
    if (signMethod === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    } else {
      return typedName || null;
    }
  };

  const generatePayments = async (contractId: string, tenantId: string, amount: number, startDate: string, endDate: string, paymentDay: number) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const payments = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const daysInMonth = getDaysInMonth(current);
      const day = Math.min(paymentDay, daysInMonth);
      const dueDate = new Date(current.getFullYear(), current.getMonth(), day);

      payments.push({
        contract_id: contractId,
        tenant_id: tenantId,
        amount,
        due_date: dueDate.toISOString(),
        paid: false,
        month_year: format(current, 'yyyy-MM'),
      });

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    if (payments.length > 0) {
      const { error } = await supabase.from('payments').insert(payments);
      if (error) throw error;
    }
  };

  const handleSign = async () => {
    if (!contract || !user) return;
    if (signMethod === 'draw' && !hasDrawn) return;
    if (signMethod === 'type' && !typedName.trim()) return;

    setSigning(true);
    try {
      const signature = getSignatureData();
      const bothSigned = contract.signed_by_landlord;

      const signRes = await fetch('/api/modules/e-signature/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id, signerRole: 'tenant' }),
      });
      const signJson = await signRes.json();
      if (!signRes.ok) throw new Error(signJson.error || 'Error al registrar firma');

      const newStatus = bothSigned ? 'activo' : 'firmado';
      await supabase.from('contracts').update({ status: newStatus }).eq('id', contract.id);

      // Upload signature
      if (signature) {
        // eslint-disable-next-line react-hooks/purity
        const fileName = `signature_tenant_${contract.id}_${Date.now()}.png`;
        const { error: uploadErr } = await supabase.storage
          .from('contract-documents')
          .upload(fileName, dataURLToBlob(signature));
        if (uploadErr) throw uploadErr;
      }

      // If both signed, generate payments
      if (bothSigned && contract.start_date && contract.end_date) {
        await generatePayments(
          contract.id,
          user.id,
          contract.monthly_rent,
          contract.start_date,
          contract.end_date,
          contract.payment_day
        );
      }

      // Notify
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          contract_id: contract.id,
          type: 'contrato_firmado',
          title: bothSigned ? 'Contrato firmado por ambas partes' : 'Has firmado el contrato',
          message: bothSigned
            ? `El contrato para ${propertyTitle} ha sido firmado por ambas partes.`
            : `Has firmado el contrato para ${propertyTitle}. Esperando la firma del arrendador.`,
          read: false,
        },
        {
          user_id: contract.landlord_id,
          contract_id: contract.id,
          type: 'contrato_firmado',
          title: bothSigned ? 'Contrato firmado por ambas partes' : 'El arrendatario firmó el contrato',
          message: bothSigned
            ? `El arrendatario firmó el contrato para ${propertyTitle}. El contrato ya está activo.`
            : `El arrendatario ha firmado el contrato para ${propertyTitle}. Revisa y firma como arrendador.`,
          read: false,
        }
      ]);

      setSigned(true);

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/tenant');
      }, 2500);
    } catch (err) {
      console.error('Error signing contract:', err);
      toast({ type: 'error', message: t('error_sign') });
    } finally {
      setSigning(false);
    }
  };

  function dataURLToBlob(dataURL: string) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)![1];
    const bytes = atob(parts[1]);
    const ab = new ArrayBuffer(bytes.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i);
    return new Blob([ab], { type: mime });
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">{t('loading_contract')}</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-red-600" />
        <p className="text-sm font-semibold text-muted-foreground">{t('contract_not_found')}</p>
        <button
          onClick={() => router.push('/dashboard/tenant')}
          className="text-xs text-primary font-bold hover:underline cursor-pointer"
        >
          {t('back_to_dashboard')}
        </button>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-full bg-blue-50 border border-blue-200 text-blue-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">{t('signed_success_title')}</h2>
        <p className="text-xs text-muted-foreground text-center max-w-md">
          {t('signed_success_desc', { property: propertyTitle })}
          {contract.signed_by_landlord
            ? t('signed_both_parts')
            : t('signed_waiting_landlord')}
        </p>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-2" />
        <p className="text-[10px] text-muted-foreground">{t('redirecting')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        {t('back')}
      </button>

      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            {t('sign_contract')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{t('sign_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-card border border-border rounded-2xl px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{t('contract_label')}</span>
            <span className="font-bold text-foreground">#{contract.contract_number || contract.id.slice(0, 8)}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{t('status_label')}</span>
            <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <FileSignature className="w-3 h-3" /> {t('pending_signature')}
            </span>
          </div>
        </div>
      </div>

      {/* Contract info card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{t('property')}</span>
              <span className="block text-sm font-bold text-foreground">{propertyTitle}</span>
              <span className="block text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{propertyAddress}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{t('landlord')}</span>
              <span className="block text-sm font-bold text-foreground">{landlordName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{t('monthly_rent')}</span>
              <span className="block text-sm font-bold text-foreground">{formatCOP(contract.monthly_rent)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{t('validity')}</span>
              <span className="block text-sm font-bold text-foreground">
                {contract.start_date ? format(parseISO(contract.start_date), 'dd/MMM/yyyy', { locale: es }) : '—'}
              </span>
              {contract.end_date && (
                <span className="block text-[10px] text-muted-foreground">
                  {t('until')} {format(parseISO(contract.end_date), 'dd/MMM/yyyy', { locale: es })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contract content rendered */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          {t('contract_document')}
        </h3>
        <div className="bg-white text-black border border-border rounded-3xl p-6 md:p-10 shadow-sm max-h-[600px] overflow-y-auto prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(contract.contract_content || `<p class="text-muted-foreground">${t('no_content')}</p>`) }} />
        </div>
      </div>

      {/* Signature box */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-extrabold text-foreground mb-4 flex items-center gap-2">
          <PenLine className="w-5 h-5 text-primary" />
          {t('your_signature')}
        </h3>

        {/* Method selector */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setSignMethod('draw')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              signMethod === 'draw'
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <PenLine className="w-4 h-4" />
            {t('draw_signature')}
          </button>
          <button
            onClick={() => setSignMethod('type')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              signMethod === 'type'
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <PenLine className="w-4 h-4" />
            {t('type_name')}
          </button>
        </div>

        {signMethod === 'draw' ? (
          <div className="space-y-3">
            <div
              className="relative bg-white border-2 border-dashed border-border rounded-2xl overflow-hidden touch-none"
              style={{ minHeight: 200 }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ display: 'block' }}
              />
              {!hasDrawn && (
                <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none select-none">
                  {t('draw_here')}
                </p>
              )}
            </div>
            <button
              onClick={clearCanvas}
              className="text-[10px] font-bold text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              {t('clear_signature')}
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder={t('name_placeholder')}
              className="w-full px-4 py-3.5 bg-white border-2 border-dashed border-border rounded-2xl text-sm font-semibold text-black placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <p className="text-[10px] text-muted-foreground mt-2">{t('name_helper')}</p>
          </div>
        )}

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 mt-6 cursor-pointer group">
          <div
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className={`p-1 rounded-md border-2 transition-all shrink-0 mt-0.5 ${
              acceptedTerms
                ? 'bg-primary border-primary text-white'
                : 'border-muted-foreground group-hover:border-primary/50'
            }`}
          >
            {acceptedTerms && <Check className="w-3 h-3" />}
          </div>
          <span className="text-xs leading-relaxed text-muted-foreground font-medium">
            {t('terms_text')}
          </span>
        </label>

        {/* Sign button */}
        <button
          onClick={handleSign}
          disabled={
            signing ||
            !acceptedTerms ||
            (signMethod === 'draw' && !hasDrawn) ||
            (signMethod === 'type' && !typedName.trim())
          }
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer disabled:active:scale-100"
        >
          {signing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('signing')}
            </>
          ) : (
            <>
              <FileSignature className="w-4 h-4" />
              {t('sign_contract')}
            </>
          )}
        </button>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-foreground">{t('electronic_signature')}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {t('signature_info_1')}
            {contract.signed_by_landlord
              ? t('signature_info_2_landlord_signed')
              : t('signature_info_2_pending')}
          </p>
        </div>
      </div>

    </div>
  );
}
