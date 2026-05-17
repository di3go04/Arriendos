'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Payment, Property } from '@/types';
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  X,
  CreditCard,
  Check,
  Building,
  Loader2,
  FileText,
  UploadCloud,
  ExternalLink,
  Coins
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import confetti from 'canvas-confetti';

export default function PaymentsPage() {
  const { user, profile } = useAuth();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Tenant Payment Modal config
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [reportingPayment, setReportingPayment] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Landlord Reconciliation Modal config
  const [isLandlordModalOpen, setIsLandlordModalOpen] = useState(false);
  const [reconcilingPayment, setReconcilingPayment] = useState<any | null>(null);
  const [reconciliationNotes, setReconciliationNotes] = useState('');

  useEffect(() => {
    if (user && profile) {
      fetchPaymentsData();
    }
  }, [user, profile]);

  const fetchPaymentsData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch properties (only if landlord)
      if (profile?.role === 'arrendador') {
        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user?.id);
        setProperties(props || []);
      }

      // 2. Fetch payments with joins
      let query = supabase
        .from('payments')
        .select(`
          *,
          contract:contracts (
            id,
            contract_number,
            monthly_rent,
            property:properties (id, title, address, owner_id),
            landlord:profiles!contracts_landlord_id_fkey (id, full_name, phone),
            tenant:profiles!contracts_tenant_id_fkey (id, full_name, phone)
          )
        `);

      if (profile?.role === 'arrendatario') {
        query = query.eq('tenant_id', user?.id);
      } else {
        // Landlord sees all payments of contracts where landlord_id = user.id
        query = query.eq('contract.landlord_id', user?.id);
      }

      const { data: pays, error } = await query.order('due_date', { ascending: false });
      if (error) throw error;

      // Filter out payments where contract join is null (if any DB inconsistency)
      const sanitizedPays = (pays || []).filter(p => p.contract !== null);
      setPayments(sanitizedPays);
    } catch (err) {
      console.error('Error fetching payments ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open reporting modal for Tenant
  const handleOpenReportModal = (pay: any) => {
    setReportingPayment(pay);
    setPaymentMethod('Transferencia Bancaria');
    setReceiptUrl('');
    setIsTenantModalOpen(true);
  };

  // Submit payment receipt as Tenant
  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPayment) return;

    if (!receiptUrl.trim()) {
      alert('Por favor agrega una URL de comprobante válida.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_method: paymentMethod,
          receipt_url: receiptUrl.trim()
        })
        .eq('id', reportingPayment.id);

      if (error) throw error;

      confetti({ particleCount: 60, spread: 50 });
      setIsTenantModalOpen(false);
      fetchPaymentsData();
    } catch (err) {
      console.error('Error uploading payment receipt:', err);
      alert('Error al reportar el comprobante de pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open reconciliation modal for Landlord
  const handleOpenReconcileModal = (pay: any) => {
    setReconcilingPayment(pay);
    setReconciliationNotes('');
    setIsLandlordModalOpen(true);
  };

  // Approve / Reconcile Payment as Landlord
  const handleReconcilePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingPayment) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          payment_method: reconcilingPayment.payment_method || 'Manual',
          receipt_url: reconcilingPayment.receipt_url || reconciliationNotes || 'Manual'
        })
        .eq('id', reconcilingPayment.id);

      if (error) throw error;

      // Celebrate cash arrival!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#3b82f6', '#fbbf24']
      });

      setIsLandlordModalOpen(false);
      fetchPaymentsData();
    } catch (err) {
      console.error('Error reconciling payment:', err);
      alert('Error al intentar reconciliar el cobro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side filtering
  const filteredPayments = payments.filter(p => {
    const tenantName = p.contract?.tenant?.full_name?.toLowerCase() || '';
    const propTitle = p.contract?.property?.title?.toLowerCase() || '';
    const propId = p.contract?.property?.id || '';
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = tenantName.includes(searchLower) || propTitle.includes(searchLower);
    const matchesProperty = filterPropertyId === 'all' || propId === filterPropertyId;
    
    const today = new Date();
    const isOverdue = new Date(p.due_date) < today && !p.paid;
    
    let computedStatus = 'pending';
    if (p.paid) computedStatus = 'paid';
    else if (p.receipt_url) computedStatus = 'verifying';
    else if (isOverdue) computedStatus = 'overdue';

    const matchesStatus = filterStatus === 'all' || computedStatus === filterStatus;

    return matchesSearch && matchesProperty && matchesStatus;
  });

  const getStatusBadge = (p: any) => {
    const today = new Date();
    const isOverdue = new Date(p.due_date) < today && !p.paid;

    if (p.paid) {
      return (
        <span className="inline-flex items-center gap-1 bg-success/10 border border-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" /> Pagado
        </span>
      );
    }

    if (p.receipt_url) {
      return (
        <span className="inline-flex items-center gap-1 bg-info/10 border border-info/20 text-info text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
          <UploadCloud className="w-3.5 h-3.5" /> Verificando
        </span>
      );
    }

    if (isOverdue) {
      const daysLate = differenceInDays(today, new Date(p.due_date));
      return (
        <span className="inline-flex items-center gap-1 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> En Mora ({daysLate}d)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full">
        <Clock className="w-3.5 h-3.5" /> Pendiente
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Finanzas y Transacciones
        </p>
        <h2 className="text-xl md:text-2xl font-black text-foreground">
          {profile?.role === 'arrendador' 
            ? 'Historial y Conciliación de Cobros' 
            : 'Mi Agenda y Control de Pagos'}
        </h2>
      </div>

      {/* Advanced Filter Drawer */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={profile?.role === 'arrendador' ? "Buscar por inquilino o propiedad..." : "Buscar por propiedad..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-1 focus:ring-ring block pl-9 p-2.5 outline-none"
          />
        </div>

        {/* Filter by Property (only for Landlord) */}
        {profile?.role === 'arrendador' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={filterPropertyId}
              onChange={(e) => setFilterPropertyId(e.target.value)}
              className="bg-muted text-foreground text-xs font-semibold rounded-lg border border-border p-2.5 w-full md:w-48 outline-none cursor-pointer"
            >
              <option value="all">Todas las Propiedades</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Filter by Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-muted text-foreground text-xs font-semibold rounded-lg border border-border p-2.5 w-full md:w-44 outline-none cursor-pointer"
        >
          <option value="all">Cualquier Estado</option>
          <option value="paid">Pagados</option>
          <option value="verifying">Esperando Verificación</option>
          <option value="pending">Pendientes</option>
          <option value="overdue">Vencidos (En Mora)</option>
        </select>
      </div>

      {/* Main Ledger Grid/Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-muted rounded-full inline-flex text-muted-foreground">
            <DollarSign className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">No hay cobros calendarizados</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Los registros se crean al activar un contrato de arrendamiento digital firmado.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4">{profile?.role === 'arrendador' ? 'Inquilino' : 'Propietario'}</th>
                  <th className="px-6 py-4">Propiedad</th>
                  <th className="px-6 py-4">Fecha Vence</th>
                  <th className="px-6 py-4">Monto Billed</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Método / Soporte</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPayments.map((p) => {
                  const partnerName = profile?.role === 'arrendador' 
                    ? (p.contract?.tenant?.full_name || 'Desconocido') 
                    : (p.contract?.landlord?.full_name || 'Desconocido');
                  const propTitle = p.contract?.property?.title || 'Inmueble';

                  return (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                      
                      {/* Partner name */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-foreground block text-sm">
                          {partnerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Contrato: {p.contract?.contract_number}
                        </span>
                      </td>

                      {/* Property */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground block">
                          {propTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
                          {p.contract?.property?.address}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {format(new Date(p.due_date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-black text-foreground text-sm block">
                          ${p.amount?.toLocaleString('es-CO')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(p)}
                      </td>

                      {/* Payment method/notes/receipt */}
                      <td className="px-6 py-4 max-w-[200px]">
                        {p.paid ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-success font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Pago: {p.paid_at ? new Date(p.paid_at).toLocaleDateString('es-CO') : 'Manual'}
                            </span>
                            <span className="text-[9px] text-muted-foreground block">
                              Método: {p.payment_method || 'Efectivo'}
                            </span>
                          </div>
                        ) : p.receipt_url ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-primary font-bold block">
                              Reportado ({p.payment_method})
                            </span>
                            <a
                              href={p.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-primary hover:underline inline-flex items-center gap-0.5 font-bold"
                            >
                              Ver Comprobante <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Esperando cobro</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        {/* Landlord Actions */}
                        {profile?.role === 'arrendador' && !p.paid && (
                          <button
                            onClick={() => handleOpenReconcileModal(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                              p.receipt_url
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 animate-bounce'
                                : 'bg-success/15 border border-success/20 text-success hover:bg-success hover:text-success-foreground'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{p.receipt_url ? 'Reconciliar Recibo' : 'Recibir Pago'}</span>
                          </button>
                        )}

                        {/* Tenant Actions */}
                        {profile?.role === 'arrendatario' && !p.paid && !p.receipt_url && (
                          <button
                            onClick={() => handleOpenReportModal(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary rounded-lg font-bold hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" /> Reportar Pago
                          </button>
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

      {/* TENANT REPORT PAYMENT MODAL */}
      {isTenantModalOpen && reportingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary animate-pulse" />
                Reportar Soporte de Pago
              </h3>
              <button
                onClick={() => setIsTenantModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="p-6 space-y-4">
              
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Propietario:</span>
                  <span className="font-bold text-foreground">{reportingPayment.contract?.landlord?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mes / Periodo:</span>
                  <span className="font-bold text-foreground">{reportingPayment.month_year}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border mt-1">
                  <span className="text-muted-foreground font-semibold">Valor a Declarar:</span>
                  <span className="font-black text-sm text-primary">
                    ${reportingPayment.amount?.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Medio de Transacción
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold cursor-pointer"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Efectivo">Efectivo directamente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  URL del Comprobante / Recibo Digital
                </label>
                <input
                  type="url"
                  required
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://imgur.com/recibo.png"
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none"
                />
                <span className="text-[10px] text-muted-foreground mt-1.5 block">
                  * Sube la foto del recibo a un host (Imgur, Unsplash, Google Drive) y pega el enlace directo aquí.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando comprobante...</span>
                    </>
                  ) : (
                    <span>Subir Comprobante</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LANDLORD RECONCILIATION MODAL */}
      {isLandlordModalOpen && reconcilingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-success" />
                Conciliación y Verificación de Caja
              </h3>
              <button
                onClick={() => setIsLandlordModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReconcilePayment} className="p-6 space-y-4">
              
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inquilino Emisor:</span>
                  <span className="font-bold text-foreground">{reconcilingPayment.contract?.tenant?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Propiedad Renta:</span>
                  <span className="font-bold text-foreground">{reconcilingPayment.contract?.property?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mes Correspondiente:</span>
                  <span className="font-bold text-foreground">{reconcilingPayment.month_year}</span>
                </div>
                {reconcilingPayment.receipt_url && (
                  <div className="flex justify-between items-center pt-2 border-t border-border mt-1">
                    <span className="text-muted-foreground font-semibold">Comprobante Inquilino:</span>
                    <a
                      href={reconcilingPayment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-black flex items-center gap-0.5 hover:underline"
                    >
                      Ver Foto Soporte <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border mt-1">
                  <span className="text-muted-foreground font-semibold">Valor Conciliable:</span>
                  <span className="font-black text-sm text-success">
                    ${reconcilingPayment.amount?.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Notas de Auditoría Interna
                </label>
                <textarea
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Ej: Verificado saldo en cuenta de Bancolombia exitosamente."
                  rows={3}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none resize-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsLandlordModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-success hover:bg-success/90 text-success-foreground text-xs font-bold shadow-md shadow-success/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reconciliando...</span>
                    </>
                  ) : (
                    <span>Conciliar Pago & Marcar Listo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
