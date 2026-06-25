'use client';

import { useTranslations } from 'next-intl'
import { sanitizeHtml } from '@/lib/sanitize';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SmartInput } from '@/components/ui/SmartInput';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Contract,ContractTemplate,Profile,Property } from '@/types';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { AnimatePresence,motion } from 'framer-motion';
import {
AlertTriangle,
Building,
CalendarDays,
Check,
ClipboardList,
ExternalLink,
FileSignature,
FileText,
Loader2,
Paperclip,
PenTool,
Plus,
Trash2,
User,
X
} from 'lucide-react';
import React,{ useEffect,useRef,useState } from 'react';

export default function LeasesPage() {
  const t = useTranslations('contracts')
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Contract Creation Modal config
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [paymentDay, setPaymentDay] = useState('5');
  
  // Custom document IDs
  const [landlordDocId, setLandlordDocId] = useState('');
  const [tenantDocId, setTenantDocId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Digital Signature Canvas Modal
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signatureName, setSignatureName] = useState('');

  // View compiled contract HTML modal
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // Documents/Attachments Manager states
  const [documents, setDocuments] = useState<LooseRecord[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [activeViewerTab, setActiveViewerTab] = useState<'contract' | 'documents'>('contract');
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('anexo');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  async function fetchContracts() {
    setIsLoading(true);
    try {
      let query = supabase.from('contracts').select(`
        *,
        property:properties (*),
        landlord:profiles!contracts_landlord_id_fkey (*),
        tenant:profiles!contracts_tenant_id_fkey (*)
      `);

      if (profile?.role === 'arrendatario') {
        query = query.eq('tenant_id', user?.id);
      } else {
        query = query.eq('landlord_id', user?.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      toast({ type: 'error', message: t('error_load_contracts') });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchContracts();
      if (profile.role === 'arrendador') {
        fetchCreationDependencies();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  async function fetchCreationDependencies() {
    try {
      // 1. Fetch properties owned by user that are "disponible"
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id)
        .eq('status', 'disponible');
      setProperties(props || []);

      // 2. Fetch profiles registered as tenants (arrendatario)
      const { data: tens } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'arrendatario');
      setTenants(tens || []);

      // 3. Fetch contract templates owned by user or public
      const { data: temps } = await supabase
        .from('contract_templates')
        .select('*')
        .or(`owner_id.eq.${user?.id},is_public.eq.true`);
      setTemplates(temps || []);
    } catch (err) {
      console.error('Error fetching dependencies:', err);
      toast({ type: 'error', message: t('error_load_dependencies') });
    }
  };

  // Fetch contract attachments/documents
  const fetchDocuments = async (contractId: string) => {
    setIsDocsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploader:profiles!documents_uploaded_by_fkey (id, full_name, role)
        `)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast({ type: 'error', message: t('error_load_documents') });
    } finally {
      setIsDocsLoading(false);
    }
  };

  useEffect(() => {
    if (viewingContract) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDocuments(viewingContract.id);
      setActiveViewerTab('contract');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingContract]);

  // Upload custom document link
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingContract || !newDocName.trim() || !newDocUrl.trim()) return;

    setIsUploadingDoc(true);
    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          contract_id: viewingContract.id,
          uploaded_by: user?.id,
          name: newDocName.trim(),
          file_url: newDocUrl.trim(),
          type: newDocType
        });
      if (error) throw error;

      setNewDocName('');
      setNewDocUrl('');
      fetchDocuments(viewingContract.id);
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({ type: 'error', message: t('error_upload_document') });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Delete document/attachment
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm(t('confirm_delete_document'))) return;
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);
      if (error) throw error;
      
      if (viewingContract) {
        fetchDocuments(viewingContract.id);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      toast({ type: 'error', message: t('error_delete_document') });
    }
  };

  const handleOpenCreateModal = () => {
    setPropertyId('');
    setTenantId('');
    setTemplateId('');
    setContractNumber(`CON-${Date.now().toString().slice(-6)}`);
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
    setMonthlyRent('');
    setDeposit('');
    setPaymentDay('5');
    setLandlordDocId('');
    setTenantDocId('');
    setIsCreateModalOpen(true);
  };

  // HTML compiler logic
  const compileTemplate = (
    templateContent: string,
    data: {
      nombre_arrendador: string;
      identificacion_arrendador: string;
      nombre_arrendatario: string;
      identificacion_arrendatario: string;
      direccion_propiedad: string;
      canon_renta: string;
      valor_deposito: string;
      dia_pago: string;
      fecha_inicio: string;
      fecha_fin: string;
    }
  ) => {
    let compiled = templateContent;
    compiled = compiled.replace(/\{\{nombre_arrendador\}\}/g, data.nombre_arrendador);
    compiled = compiled.replace(/\{\{identificacion_arrendador\}\}/g, data.identificacion_arrendador);
    compiled = compiled.replace(/\{\{nombre_arrendatario\}\}/g, data.nombre_arrendatario);
    compiled = compiled.replace(/\{\{identificacion_arrendatario\}\}/g, data.identificacion_arrendatario);
    compiled = compiled.replace(/\{\{direccion_propiedad\}\}/g, data.direccion_propiedad);
    compiled = compiled.replace(/\{\{canon_renta\}\}/g, data.canon_renta);
    compiled = compiled.replace(/\{\{valor_deposito\}\}/g, data.valor_deposito);
    compiled = compiled.replace(/\{\{dia_pago\}\}/g, data.dia_pago);
    compiled = compiled.replace(/\{\{fecha_inicio\}\}/g, data.fecha_inicio);
    compiled = compiled.replace(/\{\{fecha_fin\}\}/g, data.fecha_fin);
    return compiled;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const prop = properties.find(p => p.id === propertyId);
    const ten = tenants.find(t => t.id === tenantId);
    const temp = templates.find(t => t.id === templateId);

    if (!prop || !ten || !temp) {
      toast({ type: 'warning', message: t('error_select_all_fields') });
      return;
    }

    setIsSubmitting(true);

    try {
      // Compile HTML
      const compiledHTML = compileTemplate(temp.content, {
        nombre_arrendador: profile.full_name || 'Propietario',
        identificacion_arrendador: landlordDocId || 'N/A',
        nombre_arrendatario: ten.full_name || 'Inquilino',
        identificacion_arrendatario: tenantDocId || 'N/A',
        direccion_propiedad: `${prop.title} - ${prop.address}, ${prop.city}`,
        canon_renta: `$${Number(monthlyRent).toLocaleString('es-CO')}`,
        valor_deposito: `$${Number(deposit).toLocaleString('es-CO')}`,
        dia_pago: paymentDay,
        fecha_inicio: startDate,
        fecha_fin: endDate || 'Indefinido',
      });

      const { error } = await supabase
        .from('contracts')
        .insert({
          property_id: propertyId,
          landlord_id: user.id,
          tenant_id: tenantId,
          template_id: templateId,
          contract_number: contractNumber,
          status: 'borrador',
          start_date: startDate,
          end_date: endDate || null,
          monthly_rent: Number(monthlyRent),
          deposit: Number(deposit) || 0,
          payment_day: Number(paymentDay),
          contract_content: compiledHTML
        })
        .select()
        .single();

      if (error) throw error;

      // Update property availability to occupied
      await supabase
        .from('properties')
        .update({ status: 'ocupado' })
        .eq('id', propertyId);

      confetti({ particleCount: 80, spread: 60 });
      setIsCreateModalOpen(false);
      fetchContracts();
      fetchCreationDependencies();
    } catch (err: unknown) {
      console.error('Error creating contract:', err);
      toast({ type: 'error', message: t('error_create_contract') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AUTOMATED BILLING GENERATOR (payments)
  const generateBillingCalendar = async (
    contractId: string,
    tenantId: string,
    startStr: string,
    endStr: string | null,
    rentVal: number,
    dueDay: number
  ) => {
    const list = [];
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date(start);
    if (!endStr) {
      end.setFullYear(end.getFullYear() + 1); // Generar 1 año por defecto
    }

    const current = new Date(start);
    while (current <= end) {
      const due = new Date(current.getFullYear(), current.getMonth(), dueDay);
      if (due < start) {
        due.setMonth(due.getMonth() + 1);
      }
      if (due > end) break;

      const monthLabel = `${(due.getMonth() + 1).toString().padStart(2, '0')}/${due.getFullYear()}`;
      list.push({
        contract_id: contractId,
        tenant_id: tenantId,
        amount: rentVal,
        due_date: format(due, 'yyyy-MM-dd'),
        paid: false,
        month_year: monthLabel
      });

      current.setMonth(current.getMonth() + 1);
    }

    if (list.length > 0) {
      const { error } = await supabase.from('payments').insert(list);
      if (error) throw error;
    }
  };

  // Rescind / Cancel Contract
  const handleRescindContract = async (c: Contract) => {
    // Optimistic UI Update
    setContracts(prev => prev.map(contract => contract.id === c.id ? { ...contract, status: 'cancelado' } : contract));
    
    let cancelled = false;
    toast({
      type: 'success',
      message: t('success_rescind_contract'),
      onUndo: () => {
        cancelled = true;
        setContracts(prev => prev.map(contract => contract.id === c.id ? { ...contract, status: c.status } : contract));
      }
    });

    setTimeout(async () => {
      if (!cancelled) {
        try {
          const { error } = await supabase.from('contracts').update({ status: 'cancelado' }).eq('id', c.id);
          if (error) throw error;
          await supabase.from('properties').update({ status: 'disponible' }).eq('id', c.property_id);
          fetchCreationDependencies();
          confetti({ particleCount: 50, colors: ['#ef4444', '#f87171'] });
        } catch (err) {
          console.error('Error rescinding contract:', err);
          setContracts(prev => prev.map(contract => contract.id === c.id ? { ...contract, status: c.status } : contract));
          toast({ type: 'error', message: t('error_rescind_contract') });
        }
      }
    }, 5500);
  };

  // Sign canvas operations
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#2563eb'; // Royal Blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleOpenSignModal = (c: Contract) => {
    setSigningContract(c);
    setSignatureName(profile?.full_name || '');
    setIsSignModalOpen(true);
    setTimeout(() => {
      clearCanvas();
    }, 100);
  };

  const handleExecuteSignature = async () => {
    if (!signingContract || !profile) return;
    if (!signatureName.trim()) {
      toast({ type: 'warning', message: t('warning_enter_name') });
      return;
    }

    try {
      const isLandlord = profile.role === 'arrendador';
      
      const payload: LooseRecord = {};
      if (isLandlord) {
        payload.signed_by_landlord = true;
        payload.landlord_signed_at = new Date().toISOString();
        payload.status = signingContract.signed_by_tenant ? 'activo' : 'pendiente_firma';
      } else {
        payload.signed_by_tenant = true;
        payload.tenant_signed_at = new Date().toISOString();
        payload.status = signingContract.signed_by_landlord ? 'activo' : 'pendiente_firma';
      }

      // 1. Update contract signing flags
      const { error } = await supabase
        .from('contracts')
        .update(payload)
        .eq('id', signingContract.id)
        .select()
        .single();

      if (error) throw error;

      // 2. If contract is now 'activo' (both signed), cascade generate payments & update property status
      if (payload.status === 'activo') {
        await generateBillingCalendar(
          signingContract.id,
          signingContract.tenant_id,
          signingContract.start_date,
          signingContract.end_date,
          signingContract.monthly_rent,
          signingContract.payment_day
        );

        await supabase
          .from('properties')
          .update({ status: 'ocupado' })
          .eq('id', signingContract.property_id);
      }

      confetti({ particleCount: 150, spread: 80 });
      setIsSignModalOpen(false);
      fetchContracts();
      fetchCreationDependencies();
    } catch (err) {
      console.error('Error signing contract:', err);
      toast({ type: 'error', message: t('error_sign_contract') });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('contracts_label')}
          </p>
          <h2 className="text-xl md:text-2xl font-black text-foreground">
            {profile?.role === 'arrendador' 
              ? `${t('issued_contracts')} (${contracts.length})` 
              : `${t('my_contracts')} (${contracts.length})`}
          </h2>
        </div>
        
        {profile?.role === 'arrendador' && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('button_emit')}</span>
          </button>
        )}
      </div>

      {/* Grid List View */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : contracts.length === 0 ? (
        <EmptyState 
          icon={<FileText className="w-16 h-16" />}
          title={t('no_contracts')}
          description={profile?.role === 'arrendador' 
            ? t('no_contracts_landlord_desc') 
            : t('no_contracts_tenant_desc')}
        />
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {contracts.map((c) => {
            const hasSigned = profile?.role === 'arrendador' ? c.signed_by_landlord : c.signed_by_tenant;
            const statusLabels: Record<string, string> = {
              borrador: t('status_draft'),
              pendiente_firma: t('status_pending_signature'),
              firmado: t('status_partial_signed'),
              activo: t('status_active'),
              finalizado: t('status_completed'),
              cancelado: t('status_cancelled')
            };
            const statusStyles: Record<string, string> = {
              borrador: 'bg-muted border-border text-muted-foreground',
              pendiente_firma: 'bg-warning/10 border-warning/20 text-warning',
              firmado: 'bg-info/10 border-info/20 text-info',
              activo: 'bg-success/10 border-success/20 text-success',
              finalizado: 'bg-muted border-border text-muted-foreground',
              cancelado: 'bg-destructive/10 border-destructive/20 text-destructive'
            };

            return (
              <motion.div
                key={c.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-card border-none rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6 transition-all ${
                  c.status === 'cancelado' ? 'opacity-70' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-primary font-black uppercase tracking-wider block">
                      {t('contract_number_prefix')} {c.contract_number}
                    </span>
                    <h3 className="font-extrabold text-base text-foreground truncate max-w-[220px]">
                      {c.property?.title || t('fallback_property_title')}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{c.property?.address}</span>
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[c.status] || ''}`}>
                    {statusLabels[c.status] || c.status}
                  </span>
                </div>

                {/* Financial and Party info */}
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-1">
                      {profile?.role === 'arrendador' ? t('label_other_party_tenant') : t('label_other_party_landlord')}
                    </span>
                    <span className="font-bold text-foreground block truncate flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      {profile?.role === 'arrendador' 
                        ? (c.tenant?.full_name || t('unknown')) 
                        : (c.landlord?.full_name || t('unknown'))}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-1">
                      {t('label_monthly_rent_card')}
                    </span>
                    <span className="font-black text-foreground block text-sm tabular-nums text-primary">
                      ${c.monthly_rent?.toLocaleString('es-CO')}{t('per_month')}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-1">
                      {t('label_deposit_card')}
                    </span>
                    <span className="font-semibold text-muted-foreground block tabular-nums text-primary">
                      ${c.deposit?.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-1">
                      {t('label_payment_day_card')}
                    </span>
                    <span className="font-semibold text-muted-foreground block flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      {t('day_prefix')} {c.payment_day}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t('start_label')} {c.start_date}</span>
                  <span>{t('end_label')} {c.end_date || t('indefinite')}</span>
                </div>

                {/* Progress Indicators for signatures */}
                <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 text-[10px] font-bold text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Check className={`w-4 h-4 shrink-0 ${c.signed_by_landlord ? 'text-success' : 'text-muted-foreground/30'}`} />
                    <span>{t('signed_landlord_label')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className={`w-4 h-4 shrink-0 ${c.signed_by_tenant ? 'text-success' : 'text-muted-foreground/30'}`} />
                    <span>{t('signed_tenant_label')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <button
                    onClick={() => setViewingContract(c)}
                    className="text-primary hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t('button_read_document')}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Sign Button */}
                    {!hasSigned && c.status !== 'cancelado' && (
                      <button
                        onClick={() => handleOpenSignModal(c)}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{t('button_sign_digitally')}</span>
                      </button>
                    )}

                    {/* Rescind Button for Landlord */}
                    {profile?.role === 'arrendador' && c.status !== 'cancelado' && (
                      <button
                        onClick={() => handleRescindContract(c)}
                        className="px-3.5 py-1.5 rounded-lg border-none text-destructive bg-destructive/10 hover:bg-destructive/20 text-[10px] font-bold shadow-[0_2px_8px_rgba(37,99,235,0.2)] transition-all cursor-pointer"
                      >
                        {t('button_rescind')}
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* CREATE CONTRACT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border-none rounded-3xl w-full max-w-xl shadow-[0_25px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up my-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary" />
                {t('title_new_contract')}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Select dependencies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t('label_property_available')}
                  </label>
                  <select
                    required
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="">{t('placeholder_select_property')}</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  {properties.length === 0 && (
                    <span className="text-[10px] text-destructive mt-1 block leading-normal">
                      {t('info_no_available_properties')}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t('label_tenant_selection')}
                  </label>
                  <select
                    required
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="">{t('placeholder_select_tenant')}</option>
                    {tenants.map(ten => (
                      <option key={ten.id} value={ten.id}>{ten.full_name} ({ten.phone || t('no_phone')})</option>
                    ))}
                  </select>
                  {tenants.length === 0 && (
                    <span className="text-[10px] text-destructive mt-1 block leading-normal">
                      {t('info_no_tenants')}
                    </span>
                  )}
                </div>
              </div>

              {/* Template selector */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t('label_template_selection')}
                </label>
                <select
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring cursor-pointer"
                >
                    <option value="">{t('placeholder_select_template')}</option>
                    {templates.map(tmp => (
                      <option key={tmp.id} value={tmp.id}>{tmp.name} {tmp.is_public ? t('public_badge') : ''}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <span className="text-[10px] text-destructive mt-1 block leading-normal">
                      {t('info_no_templates')}
                  </span>
                )}
              </div>

              {/* Financial values */}
              <div className="grid grid-cols-3 gap-4">
                <SmartInput
                  label={t('label_rent_form')}
                  required
                  value={monthlyRent}
                  onChange={setMonthlyRent}
                  formatType="currency"
                  placeholder={t('placeholder_rent')}
                />

                <SmartInput
                  label={t('label_deposit_form')}
                  value={deposit}
                  onChange={setDeposit}
                  formatType="currency"
                  placeholder={t('placeholder_deposit')}
                />

                <SmartInput
                  label={t('label_payment_day_form')}
                  required
                  value={paymentDay}
                  onChange={setPaymentDay}
                  formatType="id"
                  placeholder={t('placeholder_payment_day')}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t('label_start_date_form')}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t('label_end_date_form')}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none"
                  />
                </div>
              </div>

              {/* Personal Identification Documents */}
              <div className="grid grid-cols-2 gap-4">
                <SmartInput
                  label={t('label_landlord_doc_id')}
                  required
                  value={landlordDocId}
                  onChange={setLandlordDocId}
                  formatType="id"
                  placeholder={t('placeholder_landlord_doc_id')}
                />

                <SmartInput
                  label={t('label_tenant_doc_id')}
                  required
                  value={tenantDocId}
                  onChange={setTenantDocId}
                  formatType="id"
                  placeholder={t('placeholder_tenant_doc_id')}
                />
              </div>

              {/* System alerts */}
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-[10px] text-primary flex items-start gap-2">
                <ClipboardList className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>
                  {t('info_auto_compilation')}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  {t('button_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || properties.length === 0 || tenants.length === 0 || templates.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('button_emitting')}</span>
                    </>
                  ) : (
                      <span>{t('emit_contract')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ CONTRACT MODAL */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border-none rounded-3xl w-full max-w-3xl shadow-[0_25px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up my-8">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-extrabold text-sm text-foreground">
                  {t('view_contract_title_prefix')} {viewingContract.contract_number}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {viewingContract.property?.title} | {t('view_rent_label')} ${viewingContract.monthly_rent?.toLocaleString('es-CO')}{t('per_month')}
                </p>
              </div>
              <button
                onClick={() => setViewingContract(null)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Premium Split Tabs */}
            <div className="flex border-b border-border bg-muted/40 px-5 gap-6">
              <button
                onClick={() => setActiveViewerTab('contract')}
                className={`py-3 text-xs font-bold transition-all relative ${
                  activeViewerTab === 'contract'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeViewerTab === 'contract' && (
                  <motion.div layoutId="viewTabs" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
                {t('tab_legal_document')}
              </button>
              <button
                onClick={() => setActiveViewerTab('documents')}
                className={`py-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                  activeViewerTab === 'documents'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeViewerTab === 'documents' && (
                  <motion.div layoutId="viewTabs" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
                {t('tab_documents', { count: documents.length })}
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[60vh] overflow-y-auto bg-slate-50">
              {activeViewerTab === 'contract' ? (
                <div className="p-8 bg-white border-b border-border">
                  {viewingContract.contract_content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewingContract.contract_content) }}
                      className="prose max-w-none text-slate-800"
                    />
                  ) : (
                    <div className="text-center py-20 text-muted-foreground italic text-xs">
                      {t('empty_no_compiled_content')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Documents Directory */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {t('title_linked_files')}
                    </h4>

                    {isDocsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground text-xs italic">
                        {t('empty_no_documents')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {documents.map((doc) => {
                          const isUploaderCurrentUser = doc.uploaded_by === user?.id;
                          return (
                            <div
                              key={doc.id}
                              className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded bg-primary/10 border border-primary/20 text-primary shrink-0">
                                  <Paperclip className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block font-bold text-foreground text-xs truncate" title={doc.name}>
                                    {doc.name}
                                  </span>
                                  <span className="block text-[9px] text-muted-foreground">
                                    {t('label_type')} <span className="uppercase font-semibold">{doc.type}</span> | {t('label_by')} {doc.uploader?.full_name || t('system')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                  title={t('tooltip_view_file')}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                {isUploaderCurrentUser && (
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-all cursor-pointer animate-pulse"
                                    title={t('tooltip_delete_document')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add document attachment form */}
                  <form onSubmit={handleUploadDocument} className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-primary" />
                      {t('title_attach_document')}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          {t('label_document_name')}
                        </label>
                        <input
                          type="text"
                          required
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          placeholder={t('placeholder_document_name')}
                          className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-2.5 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          {t('label_document_category')}
                        </label>
                        <select
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value)}
                          className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-2.5 outline-none font-semibold cursor-pointer"
                        >
                          <option value="anexo">{t('doc_type_legal_annex')}</option>
                          <option value="inventario">{t('doc_type_inventory')}</option>
                          <option value="foto">{t('doc_type_photo')}</option>
                          <option value="otro">{t('doc_type_other')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {t('label_document_url')}
                      </label>
                      <input
                        type="url"
                        required
                        value={newDocUrl}
                        onChange={(e) => setNewDocUrl(e.target.value)}
                        placeholder={t('placeholder_document_url')}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-2.5 outline-none"
                      />
                      <span className="text-[9px] text-muted-foreground mt-1.5 block leading-normal">
                        {t('info_document_url_helper')}
                      </span>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isUploadingDoc || !newDocName.trim() || !newDocUrl.trim()}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isUploadingDoc ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t('button_attaching')}</span>
                          </>
                        ) : (
                          <span>{t('button_attach_document')}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/40 flex justify-end border-t border-border">
              <button
                onClick={() => setViewingContract(null)}
                className="px-5 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-bold transition-all cursor-pointer"
              >
                {t('button_close_contract')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWING SIGNATURE CANVAS MODAL */}
      {isSignModalOpen && signingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border-none rounded-3xl w-full max-w-md shadow-[0_25px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up my-8">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-primary animate-pulse" />
                {t('title_stamp_signature')}
              </h3>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl text-[10px] text-primary flex items-start gap-2">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-warning animate-bounce" />
                <span className="leading-relaxed">
                  {t('info_legal_consent')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('label_full_name')}
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder={t('placeholder_full_name')}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none"
                />
              </div>

              {/* Drawing Board Canvas */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('label_draw_signature')}
                </label>
                <div className="bg-slate-50 border border-border rounded-xl relative overflow-hidden h-40">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute bottom-2.5 right-2.5 px-2 py-1 text-[9px] font-bold bg-white text-muted-foreground hover:text-destructive border border-border rounded shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    {t('button_clear_signature')}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                {t('button_cancel')}
              </button>
              <button
                type="button"
                onClick={handleExecuteSignature}
                className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all cursor-pointer"
              >
                {t('button_sign_contract')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
