'use client';

import { sanitizeHtml } from '@/lib/sanitize';
import BackToHome from '@/components/shared/BackToHome';
import { useAuth } from '@/context/AuthContext';
import {
ArrowLeft,
ChevronDown,
Eye,
FileText,Info,
Loader2,
PenLine,
Plus,
Save,
Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect,useRef,useState } from 'react';

const CAMPOS_DISPONIBLES = [
  { key: 'nombre_arrendatario', label: 'Nombre arrendatario' },
  { key: 'direccion_propiedad', label: 'Direccion propiedad' },
  { key: 'canon_mensual', label: 'Canon mensual' },
  { key: 'fecha_inicio', label: 'Fecha inicio' },
  { key: 'fecha_fin', label: 'Fecha fin' },
  { key: 'nombre_arrendador', label: 'Nombre arrendador' },
  { key: 'documento_arrendatario', label: 'Documento arrendatario' },
  { key: 'deposito_garantia', label: 'Deposito garantia' },
  { key: 'dia_pago', label: 'Dia de pago' },
  { key: 'ciudad_propiedad', label: 'Ciudad propiedad' },
  { key: 'clausulas_extra', label: 'Clausulas adicionales' },
];

const EJEMPLOS_IA = [
  'Contrato de arriendo para un apartamento en Medellin, canon de $1.200.000, duracion 12 meses, incluir clausula de mascotas.',
  'Contrato de arrendamiento de local comercial en Bogota, canon $3.500.000, deposito 2 meses, duracion 2 anios.',
  'Arriendo de casa en zona residencial de Cali, 3 habitaciones, $2.000.000 mensuales, contrato por 12 meses, prohibicion de subarriendo.',
];

type ModoEditor = 'manual' | 'ia';

export default function CrearPlantillaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('create_template');

  const [modo, setModo] = useState<ModoEditor>('manual');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [descripcion, setDescripcion] = useState('');
  const [generando, setGenerando] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (modo === 'ia' && previewHtml && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [previewHtml, modo]);

  const handleInsertarCampo = (campo: { key: string; label: string }) => {
    const token = `{{${campo.key}}}`;
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? contenido.length;
    const end = editor?.selectionEnd ?? contenido.length;
    const nextContent = `${contenido.slice(0, start)}${token}${contenido.slice(end)}`;
    setContenido(nextContent);
    requestAnimationFrame(() => {
      editor?.focus();
      editor?.setSelectionRange(start + token.length, start + token.length);
    });
    setDropdownOpen(false);
  };

  const syncContentToQuill = (html: string) => {
    setContenido(html);
  };

  const handleGenerarIA = async () => {
    if (!descripcion.trim()) {
      setError(t('error_prompt_required'));
      return;
    }

    setGenerando(true);
    setError('');
    setPreviewHtml('');

    try {
      const res = await fetch('/api/plantillas/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: descripcion.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error_generate'));
      }

      const { contenidoHtml } = await res.json();

      setPreviewHtml(contenidoHtml);
      setContenido(contenidoHtml);
      syncContentToQuill(contenidoHtml);

      if (!titulo.trim()) {
        setTitulo(t('ia_title_fallback'));
      }
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('error_generate'));
    } finally {
      setGenerando(false);
    }
  };

  const handleGuardar = async () => {
    if (!titulo.trim()) {
      setError(t('error_title_required'));
      return;
    }

    const htmlAGuardar = contenido;

    if (!htmlAGuardar.trim() || htmlAGuardar.trim() === '<p><br></p>') {
      setError(t('error_content_empty'));
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const res = await fetch('/api/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim(),
          contenidoHtml: htmlAGuardar,
          tipo: modo === 'ia' ? 'ia' : 'manual',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('error_save'));
      }

      router.push('/templates');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('error_save'));
    } finally {
      setGuardando(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Boton volver al inicio */}
      <div className="mb-2">
        <BackToHome />
      </div>
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/templates')}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <FileText className="w-5 h-5" />
              </span>
              {t('page_title')}
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {modo === 'manual'
                ? t('page_subtitle_manual')
                : t('page_subtitle_ai')}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/60 border border-border rounded-xl w-fit" role="tablist">
          <button
            role="tab"
            aria-selected={modo === 'manual'}
            onClick={() => setModo('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              modo === 'manual'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            {t('tab_manual')}
          </button>
          <button
            role="tab"
            aria-selected={modo === 'ia'}
            onClick={() => setModo('ia')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              modo === 'ia'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {t('tab_ai')}
          </button>
        </div>

        {/* Editor Card */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">

          {/* Title + Save */}
          <div className="p-4 md:p-6 border-b border-border space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('title_label')}
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="{t('title_placeholder')}"
                  className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                />
              </div>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-btn hover:shadow-btn-hover transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('save_button')}
                  </>
                )}
              </button>
            </div>

            {/* {t('insert_field')} - {t('tab_manual')} */}
            {modo === 'manual' && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-primary" />
                  {t('insert_field')}
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-72 bg-card border border-border rounded-xl shadow-modal z-50 overflow-hidden animate-slide-up">
                    <div className="p-2.5 border-b border-border bg-muted/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t('fields_label')}
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                      {CAMPOS_DISPONIBLES.map((campo) => (
                        <button
                          key={campo.key}
                          onClick={() => handleInsertarCampo(campo)}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/5 hover:text-primary text-xs font-semibold text-foreground transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                          {campo.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-4 md:p-6">
            {/* {t('tab_manual')}: HTML editor */}
            <div className={modo === 'manual' ? '' : 'hidden'}>
              <textarea
                ref={editorRef}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder={t('editor_placeholder')}
                rows={18}
                className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-4 outline-none resize-y font-mono leading-relaxed"
              />
            </div>

            {/* {t('tab_ai')}: Textarea + Preview */}
            {modo === 'ia' && (
              <div className="space-y-5 animate-fade-in">
                {/* Textarea */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {t('ai_prompt_label')}
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Contrato de arriendo para un apartamento en Medellin, canon de $1.200.000, duracion 12 meses, incluir clausula de mascotas..."
                    rows={6}
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-4 outline-none resize-none"
                  />

                  {/* Ejemplos rapidos */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] font-semibold text-muted-foreground leading-7">{t('ai_suggestions_label')}</span>
                    {EJEMPLOS_IA.map((ej, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDescripcion(ej)}
                        className="text-[10px] bg-muted/50 hover:bg-primary/5 border border-border hover:border-primary/20 text-muted-foreground hover:text-primary px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium"
                      >
                        {ej.length > 55 ? ej.slice(0, 55) + '...' : ej}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleGenerarIA}
                      disabled={generando || !descripcion.trim()}
                      className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-btn hover:shadow-btn-hover transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {generando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('ai_generating')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {t('ai_generate')}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Shimmer loader */}
                {generando && (
                  <div className="space-y-3 border border-border p-6 rounded-xl bg-muted/20 animate-pulse">
                    <div className="h-4 bg-muted rounded-md w-2/3 mx-auto" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded-md w-full" />
                      <div className="h-3 bg-muted rounded-md w-11/12" />
                      <div className="h-3 bg-muted rounded-md w-5/6" />
                    </div>
                    <div className="h-3 bg-muted rounded-md w-1/4" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded-md w-full" />
                      <div className="h-3 bg-muted rounded-md w-3/4" />
                    </div>
                    <p className="text-[10px] text-center text-primary font-bold pt-2">
                      {t('ai_loading_text')}
                    </p>
                  </div>
                )}

                {/* Preview del HTML generado */}
                {previewHtml && !generando && (
                  <div ref={previewRef} className="space-y-3 border border-primary/20 rounded-xl overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-primary/10">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary">{t('ai_preview_title')}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-card px-2 py-1 rounded-md border border-border">
                        Generado por Gemini - Puedes editarlo en {t('tab_manual')}
                      </span>
                    </div>
                    <div className="p-6 max-h-[500px] overflow-y-auto bg-white text-slate-800 text-sm leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Info card */}
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          {modo === 'manual' ? (
            <div>
              <p className="text-xs font-bold text-primary mb-0.5">{t('info_title_manual')}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Usa el boton <strong>&quot;{t('insert_field')}&quot;</strong> para agregar campos dinamicos en el texto.
                Estos campos apareceran como etiquetas visuales y seran reemplazados con datos reales
                al generar un contrato. Puedes escribir texto normal y darle formato con la barra de herramientas.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-primary mb-0.5">Como funciona el {t('tab_ai')}?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Describe en lenguaje natural el contrato que necesitas e incluye todos los detalles relevantes
                (ciudad, valor, duracion, clausulas especiales). Gemini generara una plantilla profesional
                que podras revisar, editar y guardar. <strong>1500 generaciones/dia gratis</strong> con Gemini Flash.
              </p>
            </div>
          )}
        </div>

      </div>
  );
}


