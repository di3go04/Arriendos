'use client';

import { sanitizeHtml } from '@/lib/sanitize';
import BackToHome from '@/components/shared/BackToHome';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ContractTemplate } from '@/types';
import confetti from 'canvas-confetti';
import {
ChevronRight,
Copy,
Edit,
FileCode,
FileText,
Globe,
Info,
Loader2,
Lock,
Plus,
Search,
Sparkles,
Trash2,
X
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect,useState } from 'react';

const SYSTEM_VARIABLES = [
  { key: 'arrendador_nombre', label: 'Nombre del Propietario (Arrendador)', desc: 'Nombre completo del propietario que arrienda' },
  { key: 'arrendatario_nombre', label: 'Nombre del Inquilino (Arrendatario)', desc: 'Nombre completo del inquilino que toma la propiedad' },
  { key: 'arrendatario_documento', label: 'Documento de IdentificaciÃ³n', desc: 'CÃ©dula o ID del inquilino' },
  { key: 'propiedad_direccion', label: 'DirecciÃ³n del Inmueble', desc: 'DirecciÃ³n fÃ­sica completa del inmueble' },
  { key: 'propiedad_ciudad', label: 'Ciudad de la Propiedad', desc: 'Ciudad donde se ubica el inmueble' },
  { key: 'renta_mensual', label: 'Canon de Renta Mensual', desc: 'Valor mensual acordado por el arrendamiento' },
  { key: 'deposito', label: 'DepÃ³sito de GarantÃ­a', desc: 'Monto de dinero entregado en garantÃ­a' },
  { key: 'fecha_inicio', label: 'Fecha de Inicio', desc: 'DÃ­a en que entra en vigencia el arrendamiento' },
  { key: 'fecha_fin', label: 'Fecha de FinalizaciÃ³n', desc: 'DÃ­a en que expira la vigencia del arrendamiento' },
  { key: 'dia_pago', label: 'DÃ­a de Pago Pactado', desc: 'DÃ­a lÃ­mite del mes para el pago del canon' },
  { key: 'clausulas_extra', label: 'ClÃ¡usulas Adicionales', desc: 'Acuerdos o clÃ¡usulas especiales adicionales' }
];

const DEFAULT_TEMPLATE_CONTENT = `
<div style="font-family: 'Outfit', sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h2 style="text-align: center; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #3b82f6;">CONTRATO DE ARRENDAMIENTO DE VIVIENDA</h2>
  
  <p>Entre los suscritos, <strong>{{arrendador_nombre}}</strong>, mayor de edad, identificado como el Arrendador, por una parte, y por la otra <strong>{{arrendatario_nombre}}</strong> con documento <strong>{{arrendatario_documento}}</strong>, mayor de edad, identificado como el Arrendatario, se ha convenido celebrar el presente contrato de arrendamiento regido bajo las siguientes condiciones:</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">1. OBJETO Y DIRECCIÃ“N</h3>
  <p>El arrendador concede al arrendatario el goce del inmueble ubicado en la direcciÃ³n: <strong>{{propiedad_direccion}}</strong>, en la ciudad de <strong>{{propiedad_ciudad}}</strong>.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">2. VALOR Y FORMA DE PAGO</h3>
  <p>El precio mensual del arrendamiento es la suma de <strong>{{renta_mensual}}</strong> mensuales, pagaderos por mes anticipado dentro de los primeros <strong>{{dia_pago}}</strong> dÃ­as de cada mes calendario.</p>
  <p>Asimismo, se pacta un depÃ³sito de garantÃ­a por valor de <strong>{{deposito}}</strong> para responder por servicios y daÃ±os menores al inmueble.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">3. TÃ‰RMINO Y VIGENCIA</h3>
  <p>El tÃ©rmino de vigencia de este acuerdo serÃ¡ de un aÃ±o, comenzando el <strong>{{fecha_inicio}}</strong> y finalizando el <strong>{{fecha_fin}}</strong>.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">4. ACUERDOS Y CLÃUSULAS ADICIONALES</h3>
  <p>{{clausulas_extra}}</p>

  <br/><br/>
  <div style="display: flex; justify-content: space-between; margin-top: 50px;">
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 10px;">
        <strong>EL ARRENDADOR</strong>
      </div>
    </div>
    <div style="text-align: center; width: 45%;">
      <div style="border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 10px;">
        <strong>EL ARRENDATARIO</strong>
      </div>
    </div>
  </div>
</div>
`;

export default function TemplatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('TEMPLATES_PAGE');

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Editor States (100% Visual / WYSIWYG)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState(DEFAULT_TEMPLATE_CONTENT);
  const [isPublic, setIsPublic] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Template Generator States (100% Visual)
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResultContent, setAiResultContent] = useState('');
  const [aiResultTitle, setAiResultTitle] = useState('');
  const [isAiPublic, setIsAiPublic] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleOpenAiCreator = () => {
    setAiPrompt('');
    setAiResultContent('');
    setAiResultTitle('');
    setAiError('');
    setIsAiPublic(false);
    setIsAiOpen(true);
  };

  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) {
      setAiError(t('error_ai_prompt'));
      return;
    }

    setIsGenerating(true);
    setAiError('');
    setAiResultContent('');

    try {
      const res = await fetch('/api/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t('error_ai_service'));
      }

      const data = await res.json();
      setAiResultContent(data.templateContent || '');
      setAiResultTitle(data.titleSuggested || t('default_ai_title'));
    } catch (err: unknown) {
      console.error('Error generating template with IA:', err);
      setAiError((err as { message?: string }).message || t('error_ai_generic'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiTemplate = async () => {
    if (!aiResultTitle.trim()) {
      setAiError(t('error_name_required'));
      return;
    }
    if (!aiResultContent.trim()) {
      setAiError(t('error_content_empty'));
      return;
    }

    setIsSubmitting(true);
    setAiError('');

    try {
      const regex = /\{\{([^}]+)\}\}/g;
      const detectedVariables: string[] = [];
      let match;
      while ((match = regex.exec(aiResultContent)) !== null) {
        if (!detectedVariables.includes(match[1])) {
          detectedVariables.push(match[1]);
        }
      }

      const payload = {
        name: aiResultTitle,
        content: aiResultContent,
        variables: detectedVariables,
        is_public: isAiPublic,
        owner_id: user?.id
      };

      const { error } = await supabase
        .from('contract_templates')
        .insert(payload);
      
      if (error) throw error;

      confetti({ particleCount: 60, spread: 50 });
      toast({ type: 'success', message: t('save_ai_success') });
      setIsAiOpen(false);
      fetchTemplates();
    } catch (err: unknown) {
      console.error('Error saving AI template:', err);
      setAiError((err as { message?: string }).message || t('error_generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertVariableIntoAiTemplate = (variableKey: string) => {
    const placeholder = `{{${variableKey}}}`;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(placeholder));
      const el = document.getElementById('ai-visual-editor');
      if (el) {
        setAiResultContent(el.innerHTML);
      }
    } else {
      setAiResultContent(prev => prev + ` ${placeholder}`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchTemplates() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .or(`owner_id.eq.${user?.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreator = () => {
    setEditingTemplate(null);
    setName('');
    setContent(DEFAULT_TEMPLATE_CONTENT);
    setIsPublic(false);
    setErrorMsg('');
    setIsEditorOpen(true);
  };

  const handleOpenEditor = (template: ContractTemplate) => {
    if (template.owner_id !== user?.id) {
      toast({ type: 'warning', message: t('public_warning') });
      return;
    }
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content);
    setIsPublic(template.is_public);
    setErrorMsg('');
    setIsEditorOpen(true);
  };

  const insertVariable = (variableKey: string) => {
    const placeholder = `{{${variableKey}}}`;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(placeholder));
      const el = document.getElementById('manual-visual-editor');
      if (el) {
        setContent(el.innerHTML);
      }
    } else {
      setContent(prev => prev + ` ${placeholder}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t('error_name_required'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const regex = /\{\{([^}]+)\}\}/g;
      const detectedVariables: string[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (!detectedVariables.includes(match[1])) {
          detectedVariables.push(match[1]);
        }
      }

      const payload = {
        name,
        content,
        variables: detectedVariables,
        is_public: isPublic,
        owner_id: user?.id
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('contract_templates')
          .update(payload)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        toast({ type: 'success', message: t('update_success') });
      } else {
        const { error } = await supabase
          .from('contract_templates')
          .insert(payload);
        if (error) throw error;
        toast({ type: 'success', message: t('save_success') });
      }

      confetti({ particleCount: 60, spread: 50 });
      setIsEditorOpen(false);
      fetchTemplates();
    } catch (err: unknown) {
      console.error('Error saving template:', err);
      setErrorMsg((err as { message?: string }).message || t('error_generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    const confirmCopy = window.confirm(t('duplicate_confirm', { name: template.name }));
    if (!confirmCopy) return;

    try {
      const copyPayload = {
        name: `${template.name} (Copia)`,
        content: template.content,
        variables: template.variables,
        is_public: false,
        owner_id: user?.id
      };

      const { error } = await supabase
        .from('contract_templates')
        .insert(copyPayload);

      if (error) throw error;

      confetti({ particleCount: 40, spread: 40 });
      toast({ type: 'success', message: t('duplicate_success') });
      fetchTemplates();
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast({ type: 'error', message: t('duplicate_error') });
    }
  };

  const handleDelete = async (template: ContractTemplate) => {
    if (template.owner_id !== user?.id) {
      toast({ type: 'error', message: t('not_authorized') });
      return;
    }

    const confirmDelete = window.confirm(t('delete_confirm', { name: template.name }));
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast({ type: 'success', message: t('delete_success') });
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      toast({ type: 'error', message: t('delete_error') });
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* BotÃ³n volver al inicio */}
      <div className="mb-2">
        <BackToHome />
      </div>

      {/* Header and Add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <FileCode className="w-6 h-6" />
            </span>
            <span>{t('page_title')}</span>
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            {t('page_subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
          <button
            onClick={handleOpenAiCreator}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-card border border-border hover:bg-muted text-foreground text-xs font-bold rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>{t('create_ai')}</span>
          </button>

          <button
            onClick={handleOpenCreator}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-2xl transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{t('new_template')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border p-4 rounded-3xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary pl-10 pr-4 py-3 outline-none"
          />
        </div>
      </div>

      {/* Main Table view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">{t('loading')}</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">{t('table_header_name')}</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">{t('table_header_created')}</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">{t('table_header_access')}</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">{t('table_header_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTemplates.map((template) => {
                  const isOwner = template.owner_id === user?.id;
                  return (
                    <tr key={template.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="p-2 rounded-xl bg-primary/5 text-primary border border-primary/10">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="block text-xs font-extrabold text-foreground">{template.name}</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              {t('variables_count', { count: template.variables?.length || 0 })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground font-semibold">
                          {new Date(template.created_at).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="p-4">
                        {template.is_public ? (
                          <span className="inline-flex items-center gap-1 bg-success/15 border border-success/30 text-success text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            <Globe className="w-3 h-3" /> {t('access_public')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            <Lock className="w-3 h-3" /> {t('access_private')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* edit only for owners */}
                          {isOwner ? (
                            <button
                              onClick={() => handleOpenEditor(template)}
                              title={t('tooltip_edit')}
                              className="p-2 rounded-xl border border-border hover:border-primary/30 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all cursor-pointer active:scale-95"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDuplicate(template)}
                              title={t('tooltip_duplicate_public')}
                              className="p-2 rounded-xl border border-border hover:border-success/30 text-muted-foreground hover:text-success hover:bg-success/5 transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-[10px] font-bold"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{t('btn_duplicate')}</span>
                            </button>
                          )}

                          {isOwner && (
                            <button
                              onClick={() => handleDuplicate(template)}
                              title={t('tooltip_duplicate')}
                              className="p-2 rounded-xl border border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isOwner && (
                            <button
                              onClick={() => handleDelete(template)}
                              title={t('tooltip_delete')}
                              className="p-2 rounded-xl border border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center bg-card border border-border rounded-3xl max-w-xl mx-auto space-y-4">
          <FileCode className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h3 className="font-extrabold text-sm text-foreground">{t('empty_title')}</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-semibold">
            {t('empty_desc')}
          </p>
          <button
            onClick={handleOpenCreator}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t('empty_cta')}
          </button>
        </div>
      )}

      {/* Manual Visual WYSIWYG Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden animate-scale-up my-4">
            
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  {editingTemplate ? t('editor_title_edit') : t('editor_title_new')}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Escribe tu contrato de forma visual. Haz clic en las variables del panel derecho para inyectarlas directamente en el cursor.
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Split Creator Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
              
              {/* Left Column: Visual Editor Form */}
              <div className="lg:col-span-8 p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Name and Visibility Switches */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-7">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {t('editor_name_label')}
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('editor_name_placeholder')}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                      />
                    </div>

                    <div className="md:col-span-5 flex items-center justify-between bg-muted/40 border border-border p-3 rounded-xl h-[46px]">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <span className="block text-[10px] font-extrabold text-foreground leading-none">Plantilla PÃºblica</span>
                          <span className="block text-[8px] text-muted-foreground font-semibold mt-0.5">{t('editor_public_desc')}</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="sr-only peer cursor-pointer"
                        />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-primary border border-border"></div>
                      </label>
                    </div>
                  </div>

                  {/* Body Editor Container */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                        ðŸ“„ Contenido de Contrato (EdiciÃ³n Visual)
                      </label>
                      
                      {/* Format buttons toolbar */}
                      <div className="flex items-center flex-wrap gap-1 bg-muted p-1 rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => document.execCommand('bold')}
                          className="px-2 py-1 bg-card hover:bg-muted text-[10px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                          title={t('editor_tooltip_bold')}
                        >
                          <strong>N</strong>
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('italic')}
                          className="px-2 py-1 bg-card hover:bg-muted text-[10px] italic text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                          title={t('editor_tooltip_italic')}
                        >
                          <em>K</em>
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('formatBlock', false, '<h2>')}
                          className="px-2 py-1 bg-card hover:bg-muted text-[9px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                        >
                          TÃ­tulo H2
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('formatBlock', false, '<h3>')}
                          className="px-2 py-1 bg-card hover:bg-muted text-[9px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                        >
                          TÃ­tulo H3
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('formatBlock', false, '<p>')}
                          className="px-2 py-1 bg-card hover:bg-muted text-[9px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                        >
                          PÃ¡rrafo
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div
                        id="manual-visual-editor"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setContent(sanitizeHtml(e.currentTarget.innerHTML))}
                        dangerouslySetInnerHTML={{ __html: content }}
                        className="w-full bg-white text-slate-800 border border-border text-xs rounded-xl p-6 outline-none min-h-[350px] max-h-[450px] overflow-y-auto shadow-inner leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      {t('editor_close')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('editor_saving')}</span>
                        </>
                      ) : (
                        <span>{t('editor_save')}</span>
                      )}
                    </button>
                  </div>

                </form>
              </div>

              {/* Right Column: Dynamic Variables Side-panel */}
              <div className="lg:col-span-4 p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-muted/10">
                <div>
                  <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-primary" />
                    InyecciÃ³n de Variables
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                    Haz clic en cualquiera de las variables a continuaciÃ³n para insertarla en la posiciÃ³n exacta del cursor dentro del editor.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {SYSTEM_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="w-full text-left bg-card hover:bg-primary/5 border border-border hover:border-primary/20 p-2.5 rounded-xl transition-all cursor-pointer hover:shadow-sm active:scale-99 group flex items-start justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="block text-[11px] font-bold text-primary group-hover:text-primary-foreground">
                          {v.label}
                        </span>
                        <span className="block text-[9px] text-muted-foreground leading-normal">
                          {v.desc}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-2xl space-y-2 mt-4">
                  <span className="block text-[9px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                    ðŸ’¡ {t('editor_tip_title')}
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-normal font-medium">
                    Puedes escribir tu contrato directamente, sombrear texto y aplicar formatos ({t('editor_tooltip_bold')}, {t('editor_tooltip_italic')}, Encabezados) con la barra superior de herramientas de forma completamente visual y sencilla.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* AI Template Generator Modal (100% Visual WYSIWYG) */}
      {isAiOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden animate-scale-up my-4">
            
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="font-black text-base md:text-lg text-foreground flex items-center gap-2">
                    Crear Plantilla con Inteligencia Artificial
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Redacta contratos profesionales en segundos usando lenguaje natural y placeholders dinÃ¡micos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiError && (
              <div className="m-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Split Creator Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
              
              {/* Left Column: AI Prompt & Text Editor */}
              <div className="lg:col-span-8 p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                
                {/* Prompt Section */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-widest">
                    âœï¸ Describe lo que necesitas en tu contrato
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ej: Quiero un contrato de arrendamiento para una casa en BogotÃ¡, con clÃ¡usula de mascotas, pago el dÃ­a 10 de cada mes y depÃ³sito en garantÃ­a de 1 millÃ³n..."
                    rows={4}
                    disabled={isGenerating}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-4 outline-none resize-none"
                  />
                  
                  {/* Suggestion tags */}
                  {!aiResultContent && !isGenerating && (
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                        Sugerencias de RedacciÃ³n:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Contrato residencial en BogotÃ¡ con clÃ¡usula de mascotas y pago el dÃ­a 10.',
                          'Contrato comercial de local en MedellÃ­n con 2 meses de depÃ³sito en garantÃ­a.',
                          'Arrendamiento de apartaestudio amoblado con servicios incluidos y prohibiciÃ³n de subarriendo.',
                        ].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setAiPrompt(sug)}
                            className="text-[10px] bg-muted/50 hover:bg-primary/5 border border-border hover:border-primary/20 text-muted-foreground hover:text-primary px-3 py-1.5 rounded-lg transition-all text-left cursor-pointer font-medium"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Usa lenguaje natural. La IA de Google Gemini redactarÃ¡ y estructurarÃ¡ el contrato.
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiTemplate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Redactando con Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generar Plantilla</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Shimmer Skeleton Loader */}
                {isGenerating && (
                  <div className="space-y-4 border border-border p-6 rounded-2xl bg-card animate-pulse">
                    <div className="h-6 bg-muted rounded-md w-2/3 mx-auto mb-6"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded-md w-full"></div>
                      <div className="h-3 bg-muted rounded-md w-11/12"></div>
                      <div className="h-3 bg-muted rounded-md w-full"></div>
                    </div>
                    <div className="h-4 bg-muted rounded-md w-1/4 mt-6 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded-md w-full"></div>
                      <div className="h-3 bg-muted rounded-md w-5/6"></div>
                    </div>
                    <p className="text-[10px] text-center text-primary font-bold animate-pulse pt-4">
                      La Inteligencia Artificial de Google Gemini estÃ¡ redactando tu plantilla de contrato...
                    </p>
                  </div>
                )}

                {/* Generation Output & Editors */}
                {aiResultContent && !isGenerating && (
                  <div className="space-y-4 border-t border-border pt-4 animate-fade-in">
                    
                    {/* Suggested Title and Visibility toggle */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/20 p-4 rounded-2xl border border-border">
                      <div className="md:col-span-7">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Nombre Sugerido de la Plantilla *
                        </label>
                        <input
                          type="text"
                          required
                          value={aiResultTitle}
                          onChange={(e) => setAiResultTitle(e.target.value)}
                          className="w-full bg-card border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                        />
                      </div>

                      <div className="md:col-span-5 flex items-center justify-between bg-card border border-border p-3 rounded-xl h-[46px]">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="block text-[10px] font-extrabold text-foreground leading-none">Plantilla PÃºblica</span>
                            <span className="block text-[8px] text-muted-foreground font-semibold mt-0.5">Visible en la red</span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAiPublic}
                            onChange={(e) => setIsAiPublic(e.target.checked)}
                            className="sr-only peer cursor-pointer"
                          />
                          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-primary border border-border"></div>
                        </label>
                      </div>
                    </div>

                    {/* Rich text Editor panel */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-primary">
                          ðŸ“„ EdiciÃ³n del Contrato Generado
                        </label>

                        {/* Format buttons toolbar */}
                        <div className="flex items-center flex-wrap gap-1 bg-muted p-1 rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => document.execCommand('bold')}
                            className="px-2 py-1 bg-card hover:bg-muted text-[10px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                            title={t('editor_tooltip_bold')}
                          >
                            <strong>N</strong>
                          </button>
                          <button
                            type="button"
                            onClick={() => document.execCommand('italic')}
                            className="px-2 py-1 bg-card hover:bg-muted text-[10px] italic text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                            title={t('editor_tooltip_italic')}
                          >
                            <em>K</em>
                          </button>
                          <button
                            type="button"
                            onClick={() => document.execCommand('formatBlock', false, '<h2>')}
                            className="px-2 py-1 bg-card hover:bg-muted text-[9px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                          >
                            TÃ­tulo H2
                          </button>
                          <button
                            type="button"
                            onClick={() => document.execCommand('formatBlock', false, '<h3>')}
                            className="px-2 py-1 bg-card hover:bg-muted text-[9px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                          >
                            TÃ­tulo H3
                          </button>
                          <button
                            type="button"
                            onClick={() => document.execCommand('formatBlock', false, '<p>')}
                            className="px-2 py-1 bg-card hover:bg-muted text-[9px] font-bold text-foreground rounded border border-border shadow-sm active:scale-95 cursor-pointer"
                          >
                            PÃ¡rrafo
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <div
                          id="ai-visual-editor"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setAiResultContent(sanitizeHtml(e.currentTarget.innerHTML))}
                          dangerouslySetInnerHTML={{ __html: aiResultContent }}
                          className="w-full bg-white text-slate-800 border border-border text-xs rounded-xl p-6 outline-none min-h-[350px] max-h-[450px] overflow-y-auto shadow-inner leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setIsAiOpen(false)}
                        className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAiTemplate}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t('editor_saving')}</span>
                          </>
                        ) : (
                          <span>Guardar y Publicar Plantilla</span>
                        )}
                      </button>
                    </div>

                  </div>
                )}

              </div>

              {/* Right Column: Dynamic Variables Side-panel */}
              <div className="lg:col-span-4 p-6 space-y-4 max-h-[72vh] overflow-y-auto bg-muted/10">
                <div>
                  <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-primary" />
                    InyecciÃ³n de Variables
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                    Haz clic en cualquiera de las variables para insertarla en la posiciÃ³n exacta de tu cursor dentro del editor.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {SYSTEM_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariableIntoAiTemplate(v.key)}
                      className="w-full text-left bg-card hover:bg-primary/5 border border-border hover:border-primary/20 p-2.5 rounded-xl transition-all cursor-pointer hover:shadow-sm active:scale-99 group flex items-start justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="block text-[11px] font-bold text-primary group-hover:text-primary-foreground">
                          {v.label}
                        </span>
                        <span className="block text-[9px] text-muted-foreground leading-normal">
                          {v.desc}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-2xl space-y-2 mt-4">
                  <span className="block text-[9px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                    ðŸ’¡ {t('editor_tip_title')}
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-normal font-medium">
                    Puedes sombrear cualquier secciÃ³n de texto generada en el modo <strong>DiseÃ±o Visual</strong> y utilizar los controles de arriba para aplicar {t('editor_tooltip_bold')}, {t('editor_tooltip_italic')} o encabezados.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}






