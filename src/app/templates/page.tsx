'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ContractTemplate } from '@/types';
import {
  FileCode,
  Plus,
  Search,
  Eye,
  Copy,
  Trash2,
  Edit,
  X,
  Sparkles,
  Info,
  Globe,
  Lock,
  ChevronRight,
  Loader2,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SYSTEM_VARIABLES = [
  { key: 'arrendador_nombre', desc: 'Nombre completo del propietario' },
  { key: 'arrendatario_nombre', desc: 'Nombre completo del inquilino' },
  { key: 'arrendatario_documento', desc: 'Cédula o ID del inquilino' },
  { key: 'propiedad_direccion', desc: 'Dirección completa del inmueble' },
  { key: 'propiedad_ciudad', desc: 'Ciudad de la propiedad' },
  { key: 'renta_mensual', desc: 'Valor del canon mensual de arrendamiento' },
  { key: 'deposito', desc: 'Valor del depósito en garantía' },
  { key: 'fecha_inicio', desc: 'Fecha de inicio del contrato' },
  { key: 'fecha_fin', desc: 'Fecha de finalización del contrato' },
  { key: 'dia_pago', desc: 'Día del mes establecido para el pago' },
  { key: 'clausulas_extra', desc: 'Cláusulas o términos adicionales' }
];

const MOCK_DATA: Record<string, string> = {
  arrendador_nombre: 'CARLOS ALBERTO GÓMEZ RESTREPO',
  arrendatario_nombre: 'MARÍA FERNANDA SÁNCHEZ HERNÁNDEZ',
  arrendatario_documento: 'C.C. 1.023.456.789 de Medellín',
  propiedad_direccion: 'Calle 10A # 34-12, Apto 502, Torre Sur',
  propiedad_ciudad: 'Envigado',
  renta_mensual: '$ 1.800.000 COP',
  deposito: '$ 1.800.000 COP',
  fecha_inicio: '18 de Mayo de 2026',
  fecha_fin: '17 de Mayo de 2027',
  dia_pago: '5',
  clausulas_extra: '1. El arrendatario no podrá subarrendar el inmueble. 2. Se permiten mascotas de tamaño pequeño.'
};

const DEFAULT_TEMPLATE_CONTENT = `
<div style="font-family: 'Outfit', sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h2 style="text-align: center; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #3b82f6;">CONTRATO DE ARRENDAMIENTO DE VIVIENDA</h2>
  
  <p>Entre los suscritos, <strong>{{arrendador_nombre}}</strong>, mayor de edad, identificado como el Arrendador, por una parte, y por la otra <strong>{{arrendatario_nombre}}</strong> con documento <strong>{{arrendatario_documento}}</strong>, mayor de edad, identificado como el Arrendatario, se ha convenido celebrar el presente contrato de arrendamiento regido bajo las siguientes condiciones:</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">1. OBJETO Y DIRECCIÓN</h3>
  <p>El arrendador concede al arrendatario el goce del inmueble ubicado en la dirección: <strong>{{propiedad_direccion}}</strong>, en la ciudad de <strong>{{propiedad_ciudad}}</strong>.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">2. VALOR Y FORMA DE PAGO</h3>
  <p>El precio mensual del arrendamiento es la suma de <strong>{{renta_mensual}}</strong> mensuales, pagaderos por mes anticipado dentro de los primeros <strong>{{dia_pago}}</strong> días de cada mes calendario.</p>
  <p>Asimismo, se pacta un depósito de garantía por valor de <strong>{{deposito}}</strong> para responder por servicios y daños menores al inmueble.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">3. TÉRMINO Y VIGENCIA</h3>
  <p>El término de vigencia de este acuerdo será de un año, comenzando el <strong>{{fecha_inicio}}</strong> y finalizando el <strong>{{fecha_fin}}</strong>.</p>

  <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #475569; font-weight: 800;">4. ACUERDOS Y CLÁUSULAS ADICIONALES</h3>
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState(DEFAULT_TEMPLATE_CONTENT);
  const [isPublic, setIsPublic] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // Query templates owned by the user OR marked as public
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
    setIsPreviewMode(false);
    setIsEditorOpen(true);
  };

  const handleOpenEditor = (template: ContractTemplate) => {
    // Non-owners can duplicate public templates, but not modify them directly
    if (template.owner_id !== user?.id) {
      alert('Esta plantilla es pública. Para modificarla, por favor utiliza la acción "Duplicar" para crear una copia personal editable.');
      return;
    }
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content);
    setIsPublic(template.is_public);
    setErrorMsg('');
    setIsPreviewMode(false);
    setIsEditorOpen(true);
  };

  // Cursor-based variable injection helper
  const insertVariable = (variableKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const placeholder = `{{${variableKey}}}`;

    const newContent = before + placeholder + after;
    setContent(newContent);

    // Reposition cursor right after inserted placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    }, 50);
  };

  // Replace double curly brackets variables with realistic mock texts
  const compilePreview = () => {
    let compiled = content;
    SYSTEM_VARIABLES.forEach(v => {
      const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
      compiled = compiled.replace(regex, MOCK_DATA[v.key] || `[${v.key}]`);
    });
    setPreviewHtml(compiled);
  };

  const handleTogglePreview = () => {
    if (!isPreviewMode) {
      compilePreview();
    }
    setIsPreviewMode(!isPreviewMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la plantilla es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Find all custom tags or tags between {{ }} inside the text content
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
        // Update template
        const { error } = await supabase
          .from('contract_templates')
          .update(payload)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        // Insert new template
        const { error } = await supabase
          .from('contract_templates')
          .insert(payload);
        if (error) throw error;
      }

      confetti({ particleCount: 60, spread: 50 });
      setIsEditorOpen(false);
      fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setErrorMsg(err.message || 'Error al guardar la plantilla.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    const confirmCopy = window.confirm(`¿Deseas duplicar la plantilla "${template.name}" a tu biblioteca personal?`);
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
      alert('Plantilla duplicada y añadida con éxito.');
      fetchTemplates();
    } catch (err) {
      console.error('Error duplicating template:', err);
      alert('Error al duplicar la plantilla.');
    }
  };

  const handleDelete = async (template: ContractTemplate) => {
    if (template.owner_id !== user?.id) {
      alert('No estás autorizado para eliminar plantillas públicas de otros arrendadores.');
      return;
    }

    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la plantilla "${template.name}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      alert('Plantilla eliminada con éxito.');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Error al eliminar la plantilla de la base de datos.');
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header and Add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <FileCode className="w-6 h-6" />
            </span>
            <span>Plantillas de Contratos</span>
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Crea, edita y publica las plantillas base para automatizar tus futuros contratos de arrendamiento.
          </p>
        </div>

        <button
          onClick={handleOpenCreator}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-2xl transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 cursor-pointer active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Plantilla</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border p-4 rounded-3xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar plantillas por nombre..."
            className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary pl-10 pr-4 py-3 outline-none"
          />
        </div>
      </div>

      {/* Main Table view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">Cargando plantillas disponibles...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Plantilla</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Creado El</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Tipo Acceso</th>
                  <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
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
                              Variables vinculadas: {template.variables?.length || 0}
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
                            <Globe className="w-3 h-3" /> Público / Red
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            <Lock className="w-3 h-3" /> Personal
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* edit only for owners */}
                          {isOwner ? (
                            <button
                              onClick={() => handleOpenEditor(template)}
                              title="Editar Plantilla"
                              className="p-2 rounded-xl border border-border hover:border-primary/30 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all cursor-pointer active:scale-95"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDuplicate(template)}
                              title="Plantilla Pública: Duplica para editar"
                              className="p-2 rounded-xl border border-border hover:border-success/30 text-muted-foreground hover:text-success hover:bg-success/5 transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-[10px] font-bold"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Duplicar</span>
                            </button>
                          )}

                          {/* duplicate optionally for owners too */}
                          {isOwner && (
                            <button
                              onClick={() => handleDuplicate(template)}
                              title="Duplicar"
                              className="p-2 rounded-xl border border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* delete only for owners */}
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(template)}
                              title="Eliminar permanentemente"
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
          <h3 className="font-extrabold text-sm text-foreground">No se encontraron plantillas</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-semibold">
            Puedes diseñar plantillas HTML personalizadas o duplicar plantillas de acceso público de otros arrendadores.
          </p>
          <button
            onClick={handleOpenCreator}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Crear mi primera plantilla
          </button>
        </div>
      )}

      {/* HTML Editor Modal View */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden animate-scale-up my-4">
            
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  {editingTemplate ? 'Modificar Plantilla Base' : 'Diseñador de Plantilla de Arrendamiento'}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Usa código HTML y añade marcadores de posición dinámicos que se compilarán al emitir contratos de arrendamiento.
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
              
              {/* Left Column: Form & Code Editor */}
              <div className="lg:col-span-8 p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Name and Visibility Switches */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-7">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Nombre Descriptivo de la Plantilla *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Contrato de Apartamento Habitacional"
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                      />
                    </div>

                    <div className="md:col-span-5 flex items-center justify-between bg-muted/40 border border-border p-3 rounded-xl h-[46px]">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <span className="block text-[10px] font-extrabold text-foreground leading-none">Plantilla Pública</span>
                          <span className="block text-[8px] text-muted-foreground font-semibold mt-0.5">Visible para otros usuarios</span>
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
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                        📄 Contenido de Contrato (Formato HTML)
                      </label>
                      <button
                        type="button"
                        onClick={handleTogglePreview}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                          isPreviewMode
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border'
                        }`}
                      >
                        {isPreviewMode ? '✏️ Ver Editor de Código' : '👁️ Vista Previa Compilada'}
                      </button>
                    </div>

                    {isPreviewMode ? (
                      /* Live compiled simulation block */
                      <div className="border border-border rounded-xl bg-white p-6 h-[350px] overflow-y-auto shadow-inner text-slate-800">
                        {previewHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        ) : (
                          <div className="text-center text-xs text-muted-foreground py-10">Cargando vista previa...</div>
                        )}
                      </div>
                    ) : (
                      /* raw textarea */
                      <div className="space-y-1.5 relative">
                        <textarea
                          id="template-editor"
                          ref={textareaRef}
                          required
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Escribe tu código HTML y placeholders..."
                          rows={14}
                          className="w-full bg-[#0d131f] border border-border text-[#cbd5e1] font-mono text-[11px] leading-relaxed rounded-xl focus:ring-1 focus:ring-primary p-4 outline-none resize-y h-[350px] tab-size-4"
                        />
                        <div className="absolute right-4 bottom-4 bg-[#1e293b]/80 border border-slate-700 backdrop-blur-sm text-[9px] font-bold text-slate-400 px-2 py-1 rounded-md">
                          Caracteres: {content.length}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>Guardar Plantilla</span>
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
                    Diccionario de Variables
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                    Haz clic en cualquiera de las variables a continuación para insertarla en la posición exacta del cursor dentro del editor.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {SYSTEM_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      disabled={isPreviewMode}
                      onClick={() => insertVariable(v.key)}
                      className="w-full text-left bg-card hover:bg-primary/5 border border-border hover:border-primary/20 p-2.5 rounded-xl transition-all cursor-pointer hover:shadow-sm active:scale-99 group flex items-start justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="space-y-0.5">
                        <span className="block text-[11px] font-mono font-bold text-primary group-hover:text-primary-foreground">
                          {`{{${v.key}}}`}
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
                    💡 Tip de Edición HTML
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-normal font-medium">
                    Puedes estructurar tu contrato usando etiquetas estándar como <code className="text-primary font-mono">&lt;p&gt;</code>, <code className="text-primary font-mono">&lt;h3&gt;</code>, <code className="text-primary font-mono">&lt;strong&gt;</code> y estilos en línea (<code className="text-primary font-mono">style="..."</code>) para lograr un diseño totalmente profesional.
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
