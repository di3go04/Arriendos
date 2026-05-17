'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property, Profile, ContractTemplate } from '@/types';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import {
  FileText,
  Plus,
  Calendar,
  DollarSign,
  Building2,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function NewContractPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  // Form states
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [paymentDay, setPaymentDay] = useState('5');
  const [landlordDocId, setLandlordDocId] = useState('');
  const [tenantDocId, setTenantDocId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch form dependencies
  useEffect(() => {
    if (!user) return;

    const fetchDependencies = async () => {
      setLoadingDeps(true);
      try {
        // 1. Fetch properties owned by user that are "disponible"
        const { data: props, error: propsErr } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .eq('status', 'disponible');
        
        if (propsErr) throw propsErr;
        setProperties(props || []);

        // 2. Fetch profiles registered as tenants
        const { data: tens, error: tensErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'arrendatario');
        
        if (tensErr) throw tensErr;
        setTenants(tens || []);

        // 3. Fetch contract templates
        const { data: temps, error: tempsErr } = await supabase
          .from('contract_templates')
          .select('*')
          .or(`owner_id.eq.${user.id},is_public.eq.true`);

        if (tempsErr) throw tempsErr;
        setTemplates(temps || []);

        // Prefill default contract number
        setContractNumber(`CON-${Date.now().toString().slice(-6)}`);
        
        // Prefill start date to today
        const todayStr = new Date().toISOString().split('T')[0];
        setStartDate(todayStr);

      } catch (err) {
        console.error('Error fetching dependencies:', err);
        setErrorMsg('Error al cargar datos del formulario.');
      } finally {
        setLoadingDeps(false);
      }
    };

    fetchDependencies();
  }, [user]);

  // Autofill monthly rent and deposit when property is selected
  useEffect(() => {
    if (propertyId) {
      const selectedProperty = properties.find(p => p.id === propertyId);
      if (selectedProperty) {
        setMonthlyRent(selectedProperty.monthly_rent.toString());
        setDeposit((selectedProperty.deposit || selectedProperty.monthly_rent).toString());
      }
    }
  }, [propertyId, properties]);

  // Simple template compiler logic
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
      setErrorMsg('Por favor selecciona una propiedad, un inquilino y una plantilla.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Compile template content
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

      // 1. Insert contract
      const { error: contractErr } = await supabase
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
        });

      if (contractErr) throw contractErr;

      // 2. Update property status to occupied
      await supabase
        .from('properties')
        .update({ status: 'ocupado' })
        .eq('id', propertyId);

      // Trigger Confetti!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Redirect to Landlord Dashboard
      router.push('/dashboard/landlord');

    } catch (err: any) {
      console.error('Error creating contract:', err);
      setErrorMsg('Ocurrió un error al crear el contrato en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingDeps) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Cargando creador de contratos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Sidebar for Desktop */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative pb-16 md:pb-0">
        
        {/* Top Header Navbar */}
        <Navbar />

        {/* Dynamic Nested Sub-page content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">
          
          {/* Header section with back button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/landlord')}
              className="p-2 border border-border bg-card rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" /> Redactar Nuevo Contrato
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Genera un contrato digital firmable basado en plantillas del sistema.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2.5 max-w-4xl animate-shake">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section (Col span 2) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl">
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Select property, tenant & template */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Property */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-primary" /> Seleccionar Propiedad *
                      </label>
                      <select
                        required
                        value={propertyId}
                        onChange={(e) => setPropertyId(e.target.value)}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer font-semibold"
                      >
                        <option value="">-- Elige inmueble --</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.city})
                          </option>
                        ))}
                      </select>
                      {properties.length === 0 && (
                        <p className="text-[10px] text-amber-500 font-semibold mt-1">
                          No tienes inmuebles disponibles.
                        </p>
                      )}
                    </div>

                    {/* Tenant */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary" /> Arrendatario *
                      </label>
                      <select
                        required
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer font-semibold"
                      >
                        <option value="">-- Elige inquilino --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Template */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary" /> Plantilla de Contrato *
                      </label>
                      <select
                        required
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer font-semibold"
                      >
                        <option value="">-- Elige plantilla --</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <hr className="border-border/50" />

                  {/* Financial items & key dates */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    
                    {/* Contract Number */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        Número de Contrato *
                      </label>
                      <input
                        type="text"
                        required
                        value={contractNumber}
                        onChange={(e) => setContractNumber(e.target.value)}
                        placeholder="Ej: CON-001"
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold"
                      />
                    </div>

                    {/* Monthly Rent */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Renta Mensual *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(e.target.value)}
                        placeholder="Monto de canon"
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold"
                      />
                    </div>

                    {/* Deposit */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Depósito / Garantía
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={deposit}
                        onChange={(e) => setDeposit(e.target.value)}
                        placeholder="Monto de depósito"
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold"
                      />
                    </div>

                    {/* Payment day */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        Día de Pago Mensual *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="31"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(e.target.value)}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold"
                      />
                    </div>

                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Start Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha de Finalización
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                      />
                    </div>

                  </div>

                  {/* Identification Document IDs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Landlord ID */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> Identificación del Arrendador *
                      </label>
                      <input
                        type="text"
                        required
                        value={landlordDocId}
                        onChange={(e) => setLandlordDocId(e.target.value)}
                        placeholder="Ej: C.C. 1.094.238.112"
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                      />
                    </div>

                    {/* Tenant ID */}
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> Identificación del Arrendatario *
                      </label>
                      <input
                        type="text"
                        required
                        value={tenantDocId}
                        onChange={(e) => setTenantDocId(e.target.value)}
                        placeholder="Ej: C.C. 80.123.456"
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                      />
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/landlord')}
                      className="px-5 py-3.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-4 h-4" />
                          <span>Crear Contrato en Borrador</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>
            </div>

            {/* Sidebar quick preview panel (Col span 1) */}
            <div className="bg-gradient-to-b from-card to-card/70 border border-border rounded-3xl p-6 shadow-md flex flex-col justify-between h-fit space-y-6">
              <div>
                <div className="flex items-center gap-2.5 border-b border-border pb-3.5 mb-4">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <h3 className="text-sm font-bold text-foreground">Resumen de Contrato</h3>
                </div>

                <div className="space-y-4 text-xs font-semibold text-muted-foreground">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Número:</span>
                    <span className="text-foreground font-bold">{contractNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Canon mensual:</span>
                    <span className="text-foreground font-bold">
                      {monthlyRent ? `$${Number(monthlyRent).toLocaleString('es-CO')}` : '$0'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Depósito:</span>
                    <span className="text-foreground font-bold">
                      {deposit ? `$${Number(deposit).toLocaleString('es-CO')}` : '$0'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Día límite de pago:</span>
                    <span className="text-foreground font-bold">{paymentDay || '5'} de cada mes</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Fecha Inicio:</span>
                    <span className="text-foreground font-bold">{startDate || 'No seleccionada'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Fecha Término:</span>
                    <span className="text-foreground font-bold">{endDate || 'Indefinido'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/40 border border-border rounded-xl text-[10px] text-muted-foreground leading-relaxed font-semibold">
                Al guardar, el contrato se creará en estado <span className="text-amber-500 font-bold">borrador</span> y la propiedad pasará a estar <span className="text-foreground font-bold">ocupada</span>. Podrás compilar la firma digital desde el listado general de contratos.
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* Navigation for Mobile devices */}
      <BottomNav />
    </div>
  );
}
