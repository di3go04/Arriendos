'use client';

import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { format,parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import {
AlertTriangle,
Building2,
Calendar,
CheckCircle2,
ChevronLeft,
ClipboardList,
Download,
FileArchive,
FileImage,
FileText,
Loader2,
Save,
StickyNote,
Trash2,
UploadCloud,
User,
X
} from 'lucide-react';
import { useParams,useRouter } from 'next/navigation';
import { useEffect,useRef,useState } from 'react';
import type { Document as ContractDocument } from '@/types';

function getTypeConfig(t: ReturnType<typeof useTranslations<'contract_documents'>>) {
  return {
    inventario: { label: t('type_inventory'), icon: ClipboardList, cls: 'bg-blue-500/10 border-blue-500/25 text-blue-500' },
    foto: { label: t('type_photo'), icon: FileImage, cls: 'bg-blue-50 border-blue-200 text-blue-600' },
    anexo: { label: t('type_annex'), icon: FileText, cls: 'bg-amber-500/10 border-amber-500/25 text-amber-500' },
    otro: { label: t('type_other'), icon: FileArchive, cls: 'bg-muted border-border text-muted-foreground' },
  };
}

export default function ContractDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('contract_documents');

  const [contract, setContract] = useState<LooseRecord | null>(null);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
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
  const [deleteDoc, setDeleteDoc] = useState<LooseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

  // Access check
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!params?.id || !user || !profile) return;
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user, profile]);

  async function fetchData() {
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
      toast({ type: 'error', message: t('error_load') });
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
      toast({ type: 'error', message: t('error_save_notes') });
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

      setSuccessMsg(t('success_upload'));
      setShowUpload(false);
      setUploadName('');
      setUploadType('otro');
      setUploadFile(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({ type: 'error', message: t('error_upload') });
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

      setSuccessMsg(t('success_delete'));
      setDeleteDoc(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting document:', err);
      toast({ type: 'error', message: t('error_delete') });
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (doc: LooseValue) => {
    if (!user) return false;
    if (!contract) return false;
    return doc.uploaded_by === user.id || contract.landlord_id === user.id;
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
        <p className="text-sm font-bold text-muted-foreground">{t('access_denied')}</p>
        <button onClick={() => router.push('/dashboard/tenant')} className="text-xs text-primary font-bold hover:underline cursor-pointer">{t('back')}</button>
      </div>
    );
  }

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
        <ChevronLeft className="w-4 h-4" />
        {t('back')}
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('title')}
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
          {t('upload_document')}
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
          <span className="text-muted-foreground">{t('landlord_label')}</span>
          <span className="font-bold text-foreground">{contract.landlord?.full_name || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('tenant_label')}</span>
          <span className="font-bold text-foreground">{contract.tenant?.full_name || '—'}</span>
        </div>
      </div>

      {/* Document grid */}
      {documents.length === 0 ? (
        <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-muted rounded-full inline-flex text-muted-foreground">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-base text-foreground">{t('no_documents')}</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {t('no_documents_desc')}
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            {t('upload_first')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const cfg = getTypeConfig(t)[doc.type] || getTypeConfig(t).otro;
            const Icon = cfg.icon;
            return (
              <div key={doc.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative flex flex-col">
                {/* Type badge */}
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border w-fit mb-3 ${cfg.cls}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </div>

                {/* Name */}
                <h4 className="font-bold text-sm text-foreground mb-2 break-words">{doc.name || t('document')}</h4>

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
                      {t('download')}
                    </a>
                  )}
                  {canDelete(doc) && (
                    <button
                      onClick={() => setDeleteDoc(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-[10px] font-bold transition-all cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('delete')}
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
            {t('contract_notes')}
          </h3>
          <div className="flex items-center gap-2">
            {notesDirty && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t('unsaved')}
              </span>
            )}
            {savingNotes && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            )}
            {!notesDirty && !savingNotes && notes.length > 0 && (
              <span className="text-[10px] text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('saved')}
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          {t('notes_desc')}
        </p>
        <textarea
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          placeholder={t('notes_placeholder')}
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
            {t('save_notes')}
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
                {t('upload_title')}
              </h3>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t('document_name_label')}</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder={t('document_name_placeholder')}
                  className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t('document_type_label')}</label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value as typeof uploadType)}
                  className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none cursor-pointer"
                >
                  <option value="anexo">{t('type_annex')}</option>
                  <option value="inventario">{t('type_inventory')}</option>
                  <option value="foto">{t('type_photo')}</option>
                  <option value="otro">{t('type_other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t('file_label')}</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    uploadFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  {uploadFile ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-blue-600" />
                      <p className="text-xs font-bold text-foreground">{uploadFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        {t('remove_file')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-xs font-bold text-muted-foreground">{t('click_to_select')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('file_limits')}</p>
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
                  {t('cancel')}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFile || !uploadName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('uploading')}</>
                  ) : (
                    <><UploadCloud className="w-3.5 h-3.5" /> {t('upload_button')}</>
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
              <div className="p-3 rounded-full bg-red-50 border border-red-200 text-red-600 w-fit mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-foreground">{t('delete_confirm_title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('delete_confirm_desc', { name: deleteDoc.name })}</p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteDoc(null)}
                  className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground cursor-pointer transition-all"
                  disabled={deleting}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('deleting')}</>
                  ) : (
                    <><Trash2 className="w-3.5 h-3.5" /> {t('delete')}</>
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
