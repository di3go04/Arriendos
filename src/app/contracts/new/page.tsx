'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property, Profile, ContractTemplate } from '@/types';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import {
  Building2, User, FileText, ClipboardCheck, PenSquare,
  Check, ChevronRight, ChevronLeft, Search, Plus, Mail, Phone,
  Calendar, DollarSign, MapPin, Home, Store, Briefcase, TreePine,
  Loader2, AlertTriangle, ArrowLeft, Sparkles, X, Download,
  Send, Eye, Copy, CheckCircle2, Camera, Monitor, Globe, Lock,
  Hash, FileSignature, Clock, ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

const TYPE_ICONS: Record<string, React.ElementType> = {
  casa: Home, apartamento: Building2, local: Store, oficina: Briefcase, terreno: TreePine,
};

const STEPS = [
  { num: 1, label: 'Propiedad', icon: Building2 },
  { num: 2, label: 'Arrendatario', icon: User },
  { num: 3, label: 'Plantilla', icon: FileText },
  { num: 4, label: 'Revisión', icon: ClipboardCheck },
  { num: 5, label: 'Firma', icon: PenSquare },
];

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
}

export default function NewContractWizard() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);

  // Data from DB
  const [properties, setProperties] = useState<Property[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  // Step 1
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Step 2
  const [tenantMode, setTenantMode] = useState<'search' | 'create' | 'manual'>('search');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [tenantResults, setTenantResults] = useState<Profile[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Profile | null>(null);
  const [createTenantData, setCreateTenantData] = useState({ full_name: '', email: '', phone: '' });
  const [manualTenantData, setManualTenantData] = useState({ full_name: '', email: '', doc_id: '' });
  const [searchingTenant, setSearchingTenant] = useState(false);

  // Step 3
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentDay, setPaymentDay] = useState('5');
  const [extraClauses, setExtraClauses] = useState('');

  // Step 4
  const [compiledHtml, setCompiledHtml] = useState('');

  // Step 5
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [contractNumber, setContractNumber] = useState('');

  // Prefill startDate and contractNumber once
  useEffect(() => {
    setStartDate(new Date().toISOString().split('T')[0]);
    setContractNumber(`CON-${Date.now().toString().slice(-6)}`);
  }, []);

  // Fetch properties + templates
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadingDeps(true);
      try {
        const [propsRes, tempsRes] = await Promise.all([
          supabase.from('properties').select('*').eq('owner_id', user.id).neq('status', 'inactivo').order('created_at', { ascending: false }),
          supabase.from('contract_templates').select('*').or(`owner_id.eq.${user.id},is_public.eq.true`).order('created_at', { ascending: false }),
        ]);
        if (propsRes.error) throw propsRes.error;
        if (tempsRes.error) throw tempsRes.error;
        setProperties(propsRes.data || []);
        setTemplates(tempsRes.data || []);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setErrorMsg('Error al cargar datos del formulario.');
      } finally {
        setLoadingDeps(false);
      }
    };
    fetchData();
  }, [user]);

  // Auto-fill rent/deposit from property
  useEffect(() => {
    if (selectedProperty) {
      const end = new Date(startDate);
      end.setFullYear(end.getFullYear() + 1);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [selectedProperty, startDate]);

  // Debounced tenant search
  useEffect(() => {
    if (tenantMode !== 'search' || !tenantSearchQuery.trim()) {
      setTenantResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingTenant(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'arrendatario')
        .ilike('full_name', `%${tenantSearchQuery}%`)
        .limit(10);
      setTenantResults(data || []);
      setSearchingTenant(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [tenantSearchQuery, tenantMode]);

  const compileTemplate = useCallback(() => {
    if (!selectedTemplate || !selectedProperty || !profile) return '';
    const prop = selectedProperty;
    const name = selectedTenant?.full_name || manualTenantData.full_name || 'ARRENDATARIO';
    const docId = manualTenantData.doc_id || 'Pendiente';
    let result = selectedTemplate.content;
    const vars: Record<string, string> = {
      arrendador_nombre: profile.full_name || 'ARRENDADOR',
      arrendatario_nombre: name,
      arrendatario_documento: docId,
      propiedad_direccion: `${prop.title} - ${prop.address || ''}, ${prop.city || ''}`,
      propiedad_ciudad: prop.city || '',
      renta_mensual: formatCOP(prop.monthly_rent),
      deposito: formatCOP(prop.deposit || prop.monthly_rent),
      fecha_inicio: startDate,
      fecha_fin: endDate || 'Indefinido',
      dia_pago: paymentDay,
      clausulas_extra: extraClauses || 'Ninguna.',
    };
    Object.entries(vars).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    });
    return result;
  }, [selectedTemplate, selectedProperty, selectedTenant, manualTenantData, profile, startDate, endDate, paymentDay, extraClauses]);

  const handleCompilePreview = () => {
    const html = compileTemplate();
    if (!html) {
      setErrorMsg('Completa los pasos anteriores para generar la vista previa.');
      return;
    }
    setCompiledHtml(html);
    setStep(4);
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!user || !profile || !selectedProperty || !selectedTemplate) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Resolve tenant_id
      let tenantId = selectedTenant?.id || '';
      let tenantDocId = manualTenantData.doc_id || '';

      if (!tenantId && tenantMode === 'manual') {
        const { data: newProfile, error: createErr } = await supabase
          .from('profiles')
          .insert({
            full_name: manualTenantData.full_name,
            email: manualTenantData.email || null,
            role: 'arrendatario',
          })
          .select('id')
          .single();
        if (createErr) throw createErr;
        tenantId = newProfile.id;
      } else if (!tenantId && tenantMode === 'create') {
        const { data: newProfile, error: createErr } = await supabase
          .from('profiles')
          .insert({
            full_name: createTenantData.full_name,
            email: createTenantData.email || null,
            phone: createTenantData.phone || null,
            role: 'arrendatario',
          })
          .select('id')
          .single();
        if (createErr) throw createErr;
        tenantId = newProfile.id;
      }

      if (!tenantId) {
        setErrorMsg('Debes seleccionar o crear un arrendatario.');
        setIsSubmitting(false);
        return;
      }

      // Save signature as data URL if present
      let signatureDataUrl: string | null = null;
      if (hasSignature && canvasRef.current) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      }

      const html = compileTemplate();

      const { error: contractErr } = await supabase
        .from('contracts')
        .insert({
          property_id: selectedProperty.id,
          landlord_id: user.id,
          tenant_id: tenantId,
          template_id: selectedTemplate.id,
          contract_number: contractNumber,
          status: signatureDataUrl ? 'pendiente_firma' : 'borrador',
          start_date: startDate,
          end_date: endDate || null,
          monthly_rent: selectedProperty.monthly_rent,
          deposit: selectedProperty.deposit || selectedProperty.monthly_rent,
          payment_day: Number(paymentDay),
          contract_content: html,
          signed_by_landlord: !!signatureDataUrl,
          landlord_signed_at: signatureDataUrl ? new Date().toISOString() : null,
        });

      if (contractErr) throw contractErr;

      // Optionally store signature as document
      if (signatureDataUrl) {
        const { data: contractData } = await supabase
          .from('contracts')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (contractData) {
          const signatureBlob = await (await fetch(signatureDataUrl)).blob();
          const sigPath = `${user.id}/signature_${Date.now()}.png`;
          await supabase.storage.from('contract-documents').upload(sigPath, signatureBlob, { upsert: true });
          await supabase.from('documents').insert({
            contract_id: contractData.id,
            uploaded_by: user.id,
            name: 'Firma Arrendador',
            file_url: sigPath,
            type: 'foto',
          });

          // Notify tenant about pending signature
          await supabase.from('notifications').insert({
            user_id: tenantId,
            contract_id: contractData.id,
            type: 'contrato_pendiente_firma',
            title: 'Contrato pendiente de firma',
            message: `El arrendador ha creado un contrato para ${selectedProperty.title}. Revisa y firma digitalmente.`,
            read: false,
          });
        }
      }

      // Update property status
      await supabase.from('properties').update({ status: 'ocupado' }).eq('id', selectedProperty.id);

      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      router.push('/dashboard/leases');

    } catch (err: any) {
      console.error('Error creating contract:', err);
      setErrorMsg('Error al crear el contrato: ' + (err.message || 'desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><style>
        body { font-family: 'Outfit', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
        @media print { body { padding: 0; } }
      </style></head><body>${compiledHtml}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const canGoNext = () => {
    switch (step) {
      case 1: return !!selectedProperty;
      case 2: return !!selectedTenant || tenantMode === 'manual' || tenantMode === 'create';
      case 3: return !!selectedTemplate && !!startDate;
      case 4: return !!compiledHtml;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 3) { handleCompilePreview(); return; }
    if (step < 5) setStep(s => s + 1);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      disponible: { label: 'Disponible', cls: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' },
      ocupado: { label: 'Alquilada', cls: 'bg-blue-500/20 border-blue-500/30 text-blue-500' },
      mantenimiento: { label: 'Mantenimiento', cls: 'bg-amber-500/20 border-amber-500/30 text-amber-500' },
    };
    const s = map[status];
    return s ? <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span> : null;
  };

  if (loadingDeps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-xs font-semibold text-muted-foreground">Cargando wizard de contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex-1 flex flex-col min-h-screen relative pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1400px] mx-auto w-full space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/dashboard/landlord')}
              className="p-2 border border-border bg-card rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-amber-500" /> Nuevo Contrato
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Wizard de creación paso a paso</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Stepper */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                      step > s.num ? 'bg-emerald-500 border-emerald-500 text-white' :
                      step === s.num ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' :
                      'bg-muted border-border text-muted-foreground'
                    }`}>
                      {step > s.num ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-bold hidden sm:block ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-emerald-500' : 'bg-border'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm min-h-[400px]">
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">Seleccionar Propiedad</h3>
                    <p className="text-xs text-muted-foreground">Elige el inmueble para este contrato</p>
                  </div>
                </div>
                {properties.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No tienes propiedades disponibles. <button onClick={() => router.push('/properties')} className="text-primary font-bold hover:underline">Crear una</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map(p => {
                      const Icon = TYPE_ICONS[p.type] || Building2;
                      const selected = selectedProperty?.id === p.id;
                      return (
                        <div key={p.id} onClick={() => setSelectedProperty(p)}
                          className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
                            selected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'
                          }`}>
                          {selected && <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"><Check className="w-3.5 h-3.5 text-primary-foreground" /></div>}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-muted"><Icon className="w-4 h-4 text-primary" /></div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.type}</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-foreground mb-1 line-clamp-1">{p.title}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3 shrink-0" />{p.address}, {p.city}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-border/40">
                            <span className="font-black text-primary">{formatCOP(p.monthly_rent)}<span className="text-[10px] font-semibold text-muted-foreground">/mes</span></span>
                            {statusBadge(p.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">Datos del Arrendatario</h3>
                    <p className="text-xs text-muted-foreground">Selecciona un inquilino existente o ingresa sus datos</p>
                  </div>
                </div>

                {/* Mode tabs */}
                <div className="flex gap-2 border-b border-border pb-3">
                  {([{ id: 'search', label: 'Buscar existente', icon: Search },
                     { id: 'create', label: 'Crear nuevo', icon: Plus },
                     { id: 'manual', label: 'Datos manuales', icon: FileText },
                  ] as const).map(tab => (
                    <button key={tab.id} onClick={() => { setTenantMode(tab.id); setSelectedTenant(null); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tenantMode === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}>
                      <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  ))}
                </div>

                {tenantMode === 'search' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="text" value={tenantSearchQuery} onChange={e => setTenantSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre del arrendatario..."
                        className="w-full bg-muted border border-border text-foreground text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    {searchingTenant && <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />}
                    {tenantResults.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {tenantResults.map(t => (
                          <div key={t.id} onClick={() => setSelectedTenant(t)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedTenant?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                            }`}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                                {t.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-foreground">{t.full_name}</span>
                                <span className="block text-[10px] text-muted-foreground">{t.phone || 'Sin teléfono'}</span>
                              </div>
                            </div>
                            {selectedTenant?.id === t.id && <Check className="w-5 h-5 text-primary" />}
                          </div>
                        ))}
                      </div>
                    ) : tenantSearchQuery && !searchingTenant ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No se encontraron arrendatarios con ese nombre.</p>
                    ) : null}
                    {selectedTenant && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Arrendatario seleccionado: {selectedTenant.full_name}
                      </div>
                    )}
                  </div>
                )}

                {tenantMode === 'create' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Nombre completo *</label>
                      <input type="text" required value={createTenantData.full_name} onChange={e => setCreateTenantData(p => ({ ...p, full_name: e.target.value }))}
                        placeholder="María Sánchez" className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Email *</label>
                      <input type="email" required value={createTenantData.email} onChange={e => setCreateTenantData(p => ({ ...p, email: e.target.value }))}
                        placeholder="maria@email.com" className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Teléfono</label>
                      <input type="tel" value={createTenantData.phone} onChange={e => setCreateTenantData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="300 123 4567" className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                )}

                {tenantMode === 'manual' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Nombre completo *</label>
                      <input type="text" required value={manualTenantData.full_name} onChange={e => setManualTenantData(p => ({ ...p, full_name: e.target.value }))}
                        placeholder="María Sánchez" className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Email</label>
                      <input type="email" value={manualTenantData.email} onChange={e => setManualTenantData(p => ({ ...p, email: e.target.value }))}
                        placeholder="maria@email.com" className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Documento ID *</label>
                      <input type="text" required value={manualTenantData.doc_id} onChange={e => setManualTenantData(p => ({ ...p, doc_id: e.target.value }))}
                        placeholder="C.C. 1.023.456.789" className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">Plantilla y Variables</h3>
                    <p className="text-xs text-muted-foreground">Selecciona una plantilla y completa los datos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Plantilla *</label>
                      <select value={selectedTemplate?.id || ''} onChange={e => {
                        const t = templates.find(t => t.id === e.target.value);
                        setSelectedTemplate(t || null);
                      }}
                        className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold">
                        <option value="">-- Seleccionar plantilla --</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.is_public ? '🌐' : '🔒'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTemplate && (
                      <div className="bg-muted/30 border border-border rounded-xl p-4 max-h-48 overflow-y-auto">
                        <div className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Vista previa de la plantilla</div>
                        <div className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                          {selectedTemplate.content.slice(0, 600)}...
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">Cláusulas adicionales</label>
                      <textarea value={extraClauses} onChange={e => setExtraClauses(e.target.value)}
                        placeholder="1. El arrendatario no podrá subarrendar...&#10;2. Se permiten mascotas..."
                        rows={4} className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-4">
                    <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Datos del contrato
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Inicio *</label>
                        <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                          className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Fin</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                          className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><Hash className="w-3 h-3" /> Día de pago</label>
                        <input type="number" min="1" max="28" required value={paymentDay} onChange={e => setPaymentDay(e.target.value)}
                          className="w-full bg-muted border border-border text-foreground text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Renta</label>
                        <input type="text" readOnly value={selectedProperty ? formatCOP(selectedProperty.monthly_rent) : ''}
                          className="w-full bg-muted/50 border border-border text-foreground text-sm rounded-xl p-3 outline-none font-bold cursor-not-allowed" />
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Variables auto-completadas</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="text-muted-foreground">Arrendador:</span>
                        <span className="text-foreground font-semibold">{profile?.full_name || '—'}</span>
                        <span className="text-muted-foreground">Arrendatario:</span>
                        <span className="text-foreground font-semibold">
                          {selectedTenant?.full_name || manualTenantData.full_name || createTenantData.full_name || '—'}
                        </span>
                        <span className="text-muted-foreground">Propiedad:</span>
                        <span className="text-foreground font-semibold">{selectedProperty?.title || '—'}</span>
                        <span className="text-muted-foreground">Dirección:</span>
                        <span className="text-foreground font-semibold">{selectedProperty ? `${selectedProperty.address}, ${selectedProperty.city}` : '—'}</span>
                        <span className="text-muted-foreground">Depósito:</span>
                        <span className="text-foreground font-semibold">{selectedProperty ? formatCOP(selectedProperty.deposit || selectedProperty.monthly_rent) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">Revisión y Vista Previa</h3>
                    <p className="text-xs text-muted-foreground">Verifica el contrato antes de firmar</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setStep(3)} className="flex items-center gap-1.5 px-4 py-2 bg-muted border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                    <ChevronLeft className="w-3.5 h-3.5" /> Volver a editar
                  </button>
                  <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Descargar PDF
                  </button>
                </div>

                <div className="border border-border rounded-2xl bg-white p-6 md:p-10 max-h-[600px] overflow-y-auto shadow-inner">
                  {compiledHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: compiledHtml }} />
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">Compilando contrato...</div>
                  )}
                </div>

                <div className="bg-muted/20 border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><FileText className="w-4 h-4" /></div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">Contrato #{contractNumber}</span> — Al continuar, se generará el contrato en estado <span className="font-bold text-amber-500">pendiente de firma</span>.
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <PenSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">Firma Digital</h3>
                    <p className="text-xs text-muted-foreground">Firma el contrato como arrendador</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground">Contrato a firmar</p>
                    <div className="border border-border rounded-2xl bg-white p-4 max-h-[400px] overflow-y-auto shadow-inner text-[11px]">
                      {compiledHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: compiledHtml }} />
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">Sin contenido</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground">Tu firma</p>
                    <div className="border-2 border-dashed border-border hover:border-primary/40 rounded-2xl overflow-hidden transition-colors bg-[#0d1117]">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={180}
                        className="w-full touch-none cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={clearSignature} className="flex items-center gap-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                        <X className="w-3 h-3" /> Limpiar
                      </button>
                      {hasSignature && (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Firma capturada
                        </span>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground leading-relaxed">
                      <p className="font-bold text-foreground mb-1">Al firmar:</p>
                      <ul className="space-y-1 list-disc list-inside text-[11px]">
                        <li>El contrato se guardará como <span className="font-bold text-amber-500">pendiente de firma</span></li>
                        <li>Se marcará como firmado por el arrendador</li>
                        <li>La propiedad pasará a estado <span className="font-bold text-blue-500">alquilada</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/dashboard/landlord')}
                className="flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" /> {step > 1 ? 'Anterior' : 'Cancelar'}
              </button>

              {step < 5 ? (
                <button onClick={handleNext} disabled={!canGoNext()}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/10 transition-all disabled:opacity-40 cursor-pointer">
                  {step === 3 ? 'Vista Previa' : 'Siguiente'} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting || !hasSignature}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40 cursor-pointer">
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Firmar y Enviar</>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
