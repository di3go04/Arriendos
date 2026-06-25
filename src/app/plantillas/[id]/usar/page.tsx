'use client';

import BackToHome from '@/components/shared/BackToHome';
import { sanitizeHtml } from '@/lib/sanitize';
import { useAuth } from '@/context/AuthContext';
import type { ContractTemplate } from '@/types';
import { useTranslations } from 'next-intl';
import {
ArrowLeft,
Building2,
Calendar,
ChevronDown,
ClipboardList,
DollarSign,
Download,Eye,
FileText,
Info,
Loader2,
User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use,useEffect,useRef,useState } from 'react';

import { formatCOP,formatDate } from '@/lib/format';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface ArriendoResumen {
  id: string;
  contract_number: string | null;
  monthly_rent: number;
  deposit: number;
  start_date: string;
  end_date: string | null;
  payment_day: number;
  status: string;
  notes: string | null;
  property: {
    id: string;
    title: string;
    address: string | null;
    city: string | null;
  } | null;
  landlord: {
    id: string;
    full_name: string | null;
  } | null;
  tenant: {
    id: string;
    full_name: string | null;
  } | null;
}

function replacePlaceholders(html: string, arriendo: ArriendoResumen): string {
  const p = arriendo.property || {} as LooseRecord;
  const ll = arriendo.landlord || {} as LooseRecord;
  const tn = arriendo.tenant || {} as LooseRecord;
  const propiedadDir = [p.title, p.address, p.city].filter(Boolean).join(', ');

  const vals: Record<string, string> = {
    nombre_arrendatario: tn.full_name || '',
    direccion_propiedad: propiedadDir,
    canon_mensual: formatCOP(arriendo.monthly_rent),
    fecha_inicio: formatDate(arriendo.start_date),
    fecha_fin: formatDate(arriendo.end_date),
    nombre_arrendador: ll.full_name || '',
    documento_arrendatario: tn.full_name || 'Pendiente',
    deposito_garantia: formatCOP(arriendo.deposit),
    dia_pago: String(arriendo.payment_day),
    ciudad_propiedad: p.city || '',
    clausulas_extra: arriendo.notes || '',
    arrendatario_nombre: tn.full_name || '',
    propiedad_direccion: p.address || '',
    renta_mensual: formatCOP(arriendo.monthly_rent),
    arrendador_nombre: ll.full_name || '',
    arrendatario_documento: tn.full_name || 'Pendiente',
    deposito: formatCOP(arriendo.deposit),
    propiedad_ciudad: p.city || '',
    'NOMBRE ARRENDATARIO': tn.full_name || '',
    'DIRECCI\u00d3N PROPIEDAD': propiedadDir,
    'CANON MENSUAL': formatCOP(arriendo.monthly_rent),
    'FECHA INICIO': formatDate(arriendo.start_date),
    'FECHA FIN': formatDate(arriendo.end_date),
    'NOMBRE ARRENDADOR': ll.full_name || '',
    'DOCUMENTO ARRENDATARIO': tn.full_name || 'Pendiente',
    'DEP\u00d3SITO GARANT\u00cdA': formatCOP(arriendo.deposit),
    'D\u00cdA PAGO': String(arriendo.payment_day),
    'CIUDAD PROPIEDAD': p.city || '',
    'CL\u00c1USULAS ADICIONALES': arriendo.notes || '',
  };

  let result = html;

  result = result.replace(
    /<span[^>]*class="[^"]*campo-plantilla[^"]*"[^>]*data-campo="([^"]+)"[^>]*>.*?<\/span>/gi,
    (_, key: string) => vals[key] || '',
  );

  for (const [key, val] of Object.entries(vals)) {
    if (key.includes(' ')) {
      const re = new RegExp(`\\[${escapeRegex(key)}\\]`, 'gi');
      result = result.replace(re, val);
    }
  }

  for (const [key, val] of Object.entries(vals)) {
    if (!key.includes(' ')) {
      const re = new RegExp(`\\{\\{${escapeRegex(key)}\\}\\}`, 'g');
      result = result.replace(re, val);
    }
  }

  return result;
}

export default function UsarPlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations('use_template');
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [arriendos, setArriendos] = useState<ArriendoResumen[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [documentoHtml, setDocumentoHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function load() {
      try {
        const [resTmpl, resArrs] = await Promise.all([
          fetch(`/api/plantillas/${id}`),
          fetch('/api/arriendos'),
        ]);
        if (!resTmpl.ok) throw new Error(t('error_load_template'));
        if (!resArrs.ok) throw new Error(t('error_load_leases'));
        const tmplData = await resTmpl.json();
        const arrsData = await resArrs.json();
        setTemplate(tmplData.data);
        setArriendos(arrsData.data || []);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || t('error_load_data'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleGenerar = () => {
    if (!selectedId || !template) return;
    setGenerando(true);
    setError('');

    const arriendo = arriendos.find((a) => a.id === selectedId);
    if (!arriendo) {
      setError(t('lease_not_found'));
      setGenerando(false);
      return;
    }

    try {
      const html = replacePlaceholders(template.content, arriendo);
      setDocumentoHtml(html);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('error_generate'));
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!documentoHtml) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = previewRef.current;
      if (!element) return;

      const opt = {
        margin: [10, 10] as [number, number],
        filename: `${template?.name || 'documento'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err: unknown) {
      setError(t('error_generate_pdf') + ((err as { message?: string }).message || 'desconocido'));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  const selectedArriendo = arriendos.find((a) => a.id === selectedId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/templates')}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <BackToHome className="hidden sm:inline-flex" />
          <div>
            <h1 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <FileText className="w-5 h-5" />
              </span>
              {t('title')}
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {template?.name || t('loading')}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-card border border-border rounded-2xl shadow-card p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {t('select_lease')}
                </span>
              </div>

              {/* Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('lease')}
                </label>
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full appearance-none bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 pr-10 outline-none cursor-pointer"
                  >
                    <option value="">{t('select_placeholder')}</option>
                    {arriendos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.contract_number || '#' + a.id.slice(0, 8)} — {a.tenant?.full_name || '?'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Selected contract summary */}
              {selectedArriendo && (
                <div className="space-y-2.5 pt-1 animate-fade-in">
                  <div className="flex items-start gap-2.5 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-foreground font-semibold">
                      {selectedArriendo.property?.title || t('no_property')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-foreground font-semibold">
                      {selectedArriendo.tenant?.full_name || '?'}
                      <span className="text-muted-foreground font-normal">{t('tenant_suffix')}</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-foreground font-semibold">
                      {formatDate(selectedArriendo.start_date)} — {formatDate(selectedArriendo.end_date)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-foreground font-semibold">
                      {formatCOP(selectedArriendo.monthly_rent)}{t('per_month')}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerar}
                disabled={!selectedId || generando}
                className="w-full px-4 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-btn hover:shadow-btn-hover transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('generating')}</>
                ) : (
                  <><Eye className="w-4 h-4" /> {t('generate_document')}</>
                )}
              </button>
            </div>

            {/* Template info */}
            {template && (
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl space-y-1.5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  {t('about_template')}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('type_label')}<strong>{template.tipo === 'ia' ? t('ai_generated') : t('manual')}</strong>
                  {' \u2022 '}
                  {t('variables_label')}<strong>{template.variables?.length || 0}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    {documentoHtml ? t('document_generated') : t('preview')}
                  </span>
                </div>
                {documentoHtml && (
                  <button
                    onClick={handleDescargarPDF}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t('download_pdf')}
                  </button>
                )}
              </div>

              <div className="p-6 max-h-[700px] overflow-y-auto">
                {!documentoHtml ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <FileText className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-xs font-semibold text-muted-foreground">
                      {t('preview_empty')}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {t('preview_empty_desc')}
                    </p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <div
                      ref={previewRef}
                      className="bg-white text-slate-800 text-sm leading-relaxed p-8 rounded-xl border border-border shadow-inner"
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(documentoHtml) }} />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleDescargarPDF}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-btn hover:shadow-btn-hover transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        {t('download_pdf')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
