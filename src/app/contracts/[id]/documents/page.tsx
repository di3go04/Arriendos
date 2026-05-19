'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  FileText, UploadCloud, Trash2, Download, ChevronLeft, Loader2,
  Building2, User, Calendar, FilePenLine, Edit3, Save, X,
  FileImage, FileArchive, ClipboardList, FileSpreadsheet, Plus,
  AlertTriangle, CheckCircle2, FileSignature, MessageSquareText,
  StickyNote
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const typeConfig: Record<string, { label: string; icon: any; cls: string }> = {
  inventario: { label: 'Inventario', icon: ClipboardList, cls: 'bg-blue-500/10 border-blue-500/25 text-blue-500' },
  foto: { label: 'Foto', icon: FileImage, cls: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500' },
  anexo: { label: 'Anexo', icon: FileText, cls: 'bg-amber-500/10 border-amber-500/25 text-amber-500' },
  otro: { label: 'Otro', icon: FileArchive, cls: 'bg-muted border-border text-muted-foreground' },
};

export default function ContractDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [contract, setContract] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);

  // Notes state
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const notesTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<'anexo' | 'inventario' | 'foto' | 'otro'>('otro');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteDoc, setDeleteDoc] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

  // Access check
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!params?.id || !user || !profile) return;
    fetchData();
  }, [params.id, user, profile]);

  const fetchData = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      // Fetch contract with joins
      const { data: contractData, error: contractErr } = await supabase
        .from('contracts')
        .select(`
          *, 
          property:properties (id, title, address, city, owner_id),
          landlord:profiles!contracts_landlord_id_fkey (id, full_name, phone, role),
          tenant:profiles!contracts_tenant_id_fkey (id, full_name, phone, role)
        `)
        .eq('id', params.id)
        .single();
      if (contractErr) throw contractErr;

      // Access check
      const isLandlord = contractData.landlord_id === user.id;
      const isTenant = contractData.tenant_id === user.id;
      if (!isLandlord && !isTenant) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setContract(contractData);
      setNotes(contractData.notes || '');

      // Fetch documents
      const { data: docs, error: docsErr } = await supabase
        .from('documents')
        .select('*, uploader:profiles!documents_uploaded_by_fkey (id, full_name)')
        .eq('contract_id', params.id)
        .order('created_at', { ascending: false });
      if (docsErr) throw docsErr;
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error fetching contract documents:', err);
      toast({ type: 'error', message: 'Error al cargar los documentos del contrato.' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save notes
  const handleNotesChange = (val: string) => {
    setNotes(val);
    setNotesDirty(true);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => saveNotes(val), 1500);
  };

  const saveNotes = async (val?: string) => {
    if (!params?.id || !user) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ notes: val ?? notes })
        .eq('id', params.id);
      if (error) throw error;
      setNotesDirty(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      toast({ type: 'error', message: 'Error al guardar las notas.' });
    } finally {
      setSavingNotes(false);
    }
  };

  // Upload document
  const handleUpload = async () => {
    if (!params?.id || !user || !uploadFile || !uploadName.trim()) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split('.').pop();
      const fileName = `doc_${params.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('contract-documents')
        .upload(fileName, uploadFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(fileName);

      const { error: insertErr } = await supabase
        .from('documents')
        .insert({
          contract_id: params.id,
          uploaded_by: user.id,
          name: uploadName.trim(),
          file_url: urlData.publicUrl,
          type: uploadType,
        });
      if (insertErr) throw insertErr;

      setSuccessMsg('Documento subido exitosamente.');
      setShowUpload(false);
      setUploadName('');
      setUploadType('otro');
      setUploadFile(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({ type: 'error', message: 'Error al subir el documento.' });
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', deleteDoc.id);
      if (error) throw error;

      setSuccessMsg('Documento eliminado.');
      setDeleteDoc(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting document:', err);
      toast({ type: 'error', message: 'Error al eliminar el documento.' });
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (doc: any) => {
    if (!user) return false;
    if (!contract) return false;
    return doc.uploaded_by === user.id || contract.landlord_id === user.id;
  };

  const getFileIcon = (type: string) => {
    const cfg = typeConfig[type];
    return cfg?.icon || FileText;
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
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-sm font-bold text-muted-foreground">Acceso denegado</p>
        <button onClick={() => router.push('/dashboard/tenant')} className="text-xs text-primary font-bold hover:underline cursor-pointer">Volver</button>
      </div>
    );
  }

  const isLandlord = profile?.role === 'arrendador';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in">

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documentos del Contrato
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            #{contract.contract_number || contract.id.slice(0, 8)} — {contract.property?.title}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 text-xs transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          Subir documento
        </button>
      </div>

      {/* Contract quick info */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-4 md:gap-8 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold text-foreground">{contract.property?.title || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Arrendador:</span>
          <span className="font-bold text-foreground">{contract.landlord?.full_name || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Arrendatario:</span>
          <span className="font-bold text-foreground">{contract.tenant?.full_name || '—'}</span>
        </div>
      </div>

      {/* Document grid */}
      {documents.length === 0 ? (
        <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-muted rounded-full inline-flex text-muted-foreground">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-base text-foreground">Sin documentos</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Aún no se han subido documentos a este contrato. Sube inventarios, fotos, anexos y más.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Subir primer documento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const cfg = typeConfig[doc.type] || typeConfig.otro;
            const Icon = cfg.icon;
            return (
              <div key={doc.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative flex flex-col">
                {/* Type badge */}
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border w-fit mb-3 ${cfg.cls}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </div>

                {/* Name */}
                <h4 className="font-bold text-sm text-foreground mb-2 break-words">{doc.name || 'Documento'}</h4>

                {/* Meta */}
                <div className="mt-auto space-y-1.5 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {format(parseISO(doc.created_at), 'dd/MMM/yyyy HH:mm', { locale: es })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 shrink-0" />
                    {doc.uploader?.full_name || '—'}
                  </div>
                </div>

                {/* Actions overlay */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </a>
                  )}
                  {canDelete(doc) && (
                    <button
                      onClick={() => setDeleteDoc(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contract Notes */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            Notas del Contrato
          </h3>
          <div className="flex items-center gap-2">
            {notesDirty && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Sin guardar
              </span>
            )}
            {savingNotes && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            )}
            {!notesDirty && !savingNotes && notes.length > 0 && (
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Guardado
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          Este bloc de notas es compartido entre arrendador y arrendatario. Los cambios se guardan automáticamente.
        </p>
        <textarea
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          placeholder="Escribe notas compartidas sobre el contrato aquí..."
          rows={6}
          className="w-full bg-muted border border-border text-foreground text-sm rounded-2xl p-4 outline-none resize-y focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground/40"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => saveNotes()}
            disabled={savingNotes || !notesDirty}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar notas
          </button>
        </div>
      </div>

      {/* ===== UPLOAD MODAL ===== */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Subir documento
              </h3>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nombre del documento</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="Ej: Inventario de entrada"
                  className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tipo de documento</label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value as any)}
                  className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none cursor-pointer"
                >
                  <option value="anexo">Anexo</option>
                  <option value="inventario">Inventario</option>
                  <option value="foto">Foto</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Archivo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    uploadFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  {uploadFile ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                      <p className="text-xs font-bold text-foreground">{uploadFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-xs font-bold text-muted-foreground">Haz clic para seleccionar archivo</p>
                      <p className="text-[10px] text-muted-foreground">PDF, PNG, JPG, DOC — Max 10 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFile || !uploadName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo...</>
                  ) : (
                    <><UploadCloud className="w-3.5 h-3.5" /> Subir documento</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {deleteDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 w-fit mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-foreground">¿Eliminar documento?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Se eliminará <strong>{deleteDoc.name}</strong> de forma permanente.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteDoc(null)}
                  className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground cursor-pointer transition-all"
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Eliminando...</>
                  ) : (
                    <><Trash2 className="w-3.5 h-3.5" /> Eliminar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
