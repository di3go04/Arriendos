'use client';

import { useState, useRef, useCallback, createElement } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCOP } from '@/lib/format';
import confetti from 'canvas-confetti';
import {
  Building2, User, FileText, ClipboardCheck, PenSquare,
  Check, ChevronRight, ChevronLeft, Search, Plus, Mail, Phone,
  Calendar, DollarSign, MapPin, Home, Store, Briefcase, TreePine,
  Loader2, AlertTriangle, ArrowLeft, Sparkles, X, Download,
  Send, Eye, Copy, CheckCircle2, Camera, Monitor, Globe, Lock,
  Hash, FileSignature, Clock, ChevronDown
} from 'lucide-react';
import BottomNav from '@/components/shared/BottomNav';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import BackToHome from '@/components/shared/BackToHome';
import { useWizardState, STEPS, TYPE_ICONS } from '@/components/contracts/wizard/useWizardState';

const iconMap: Record<string, React.ElementType> = {
  Building2, User, FileText, ClipboardCheck, PenSquare,
  Home, Store, Briefcase, TreePine,
};

export default function NewContractWizard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { state, set, compileTemplate, canGoNext, hasSubmitErrors } = useWizardState(user, profile);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDraw = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  }, []);

  const draw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }, [isDrawing]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  const handleNext = () => {
    if (state.step === 3) {
      const html = compileTemplate();
      if (html) set({ compiledHtml: html, step: 4 });
      else set({ errorMsg: 'Error al compilar la plantilla' });
    } else set({ step: state.step + 1, errorMsg: '' });
  };

  const handleSubmit = async () => {
    const err = hasSubmitErrors();
    if (err) { set({ errorMsg: err }); return; }
    set({ isSubmitting: true, errorMsg: '' });
    try {
      const tenantId = state.selectedTenant?.id || (
        (await supabase.from('profiles').insert({
          full_name: state.manualTenantData.full_name,
          email: state.manualTenantData.email || null,
          role: 'arrendatario',
        }).select().single()).data?.id
      );

      const { data: contract, error: ce } = await supabase.from('contracts').insert({
        contract_number: state.contractNumber,
        property_id: state.selectedProperty!.id,
        landlord_id: user!.id,
        tenant_id: tenantId,
        monthly_rent: state.selectedProperty!.monthly_rent,
        start_date: state.startDate,
        end_date: state.endDate,
        payment_day: parseInt(state.paymentDay),
        template_id: state.selectedTemplate?.id || null,
        clauses: state.extraClauses || null,
        content_html: state.compiledHtml,
        status: 'pendiente_firma',
        signed_by_landlord: true,
        signed_by_tenant: false,
        signed_landlord_at: new Date().toISOString(),
        landlord_signature: hasSignature ? 'capturada' : null,
      }).select().single();

      if (ce) throw ce;

      await supabase.from('properties').update({ status: 'alquilada' }).eq('id', state.selectedProperty!.id);
      await supabase.from('notifications').insert({
        user_id: tenantId, type: 'contrato_pendiente_firma',
        title: 'Nuevo contrato pendiente de firma',
        message: `Tienes un contrato de arrendamiento pendiente de firma.`,
        contract_id: contract.id,
      });

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      set({ isSubmitting: false });
      setTimeout(() => router.push(`/contracts/${contract.id}`), 2000);
    } catch (err: any) {
      set({ errorMsg: err.message || 'Error al crear contrato', isSubmitting: false });
    }
  };

  if (!user || !profile) return <Loader2 className="w-6 h-6 animate-spin" />;

  const StepIcon = iconMap[STEPS[state.step - 1]?.icon || 'FileText'];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 md:px-8 pt-6 pb-24 max-w-5xl mx-auto">
          <BackToHome href="/dashboard/landlord">Volver al Dashboard</BackToHome>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Nuevo Contrato
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Paso {state.step} de 5</p>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {STEPS.map(s => (
                <div key={s.num} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  s.num === state.step ? 'bg-primary text-primary-foreground' :
                  s.num < state.step ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}>
                  {createElement(iconMap[s.icon] || FileText, { className: 'w-3 h-3' })}
                  <span className="hidden lg:inline">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {state.errorMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {state.errorMsg}
            </div>
          )}

          {/* Step 1: Property */}
          {state.step === 1 && (
            <div className="space-y-4">
              {state.loadingDeps ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <>
                  {state.properties.length === 0 ? (
                    <div className="text-center py-16">
                      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-bold text-foreground mb-1">No tienes propiedades disponibles</p>
                      <p className="text-xs text-muted-foreground mb-4">Crea una propiedad antes de generar un contrato.</p>
                      <a href="/properties" className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-primary px-5 py-2.5 rounded-xl">Crear Propiedad</a>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {state.properties.map(p => {
                        const TypeIcon = iconMap[TYPE_ICONS[p.type] || 'Building2'] || Building2;
                        return (
                          <button key={p.id} onClick={() => set({ selectedProperty: p })}
                            className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                              state.selectedProperty?.id === p.id ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30 hover:shadow-card'
                            }`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2.5 rounded-xl ${state.selectedProperty?.id === p.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                <TypeIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{p.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{p.address}, {p.city}</p>
                              </div>
                              {state.selectedProperty?.id === p.id && <Check className="w-5 h-5 text-primary shrink-0" />}
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="font-bold text-foreground tabular-nums">{formatCOP(p.monthly_rent)}/mes</span>
                              <span className="text-muted-foreground">{p.type ? p.type : ''}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Tenant */}
          {state.step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                {(['search', 'create', 'manual'] as const).map(mode => (
                  <button key={mode} onClick={() => set({ tenantMode: mode })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                      state.tenantMode === mode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}>
                    {mode === 'search' ? 'Buscar' : mode === 'create' ? 'Crear nuevo' : 'Manual'}
                  </button>
                ))}
              </div>

              {state.tenantMode === 'search' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={state.tenantSearchQuery} onChange={e => set({ tenantSearchQuery: e.target.value })}
                      placeholder="Buscar arrendatario por nombre..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary" />
                  </div>
                  {state.searchingTenant && <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />}
                  {state.tenantResults.map(t => (
                    <button key={t.id} onClick={() => set({ selectedTenant: t })}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        state.selectedTenant?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {t.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{t.full_name}</p>
                          <p className="text-[11px] text-muted-foreground">{(t as any).email || 'Sin email'}</p>
                        </div>
                        {state.selectedTenant?.id === t.id && <Check className="w-5 h-5 text-primary ml-auto" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {(state.tenantMode === 'create' || state.tenantMode === 'manual') && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nombre completo</label>
                    <input type="text" value={state.tenantMode === 'create' ? state.createTenantData.full_name : state.manualTenantData.full_name}
                      onChange={e => state.tenantMode === 'create' ? set({ createTenantData: { ...state.createTenantData, full_name: e.target.value } }) : set({ manualTenantData: { ...state.manualTenantData, full_name: e.target.value } })}
                      placeholder="Nombre del arrendatario" className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                    <input type="email" value={state.tenantMode === 'create' ? state.createTenantData.email : state.manualTenantData.email}
                      onChange={e => state.tenantMode === 'create' ? set({ createTenantData: { ...state.createTenantData, email: e.target.value } }) : set({ manualTenantData: { ...state.manualTenantData, email: e.target.value } })}
                      placeholder="correo@ejemplo.com" className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary" />
                  </div>
                  {state.tenantMode === 'create' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Teléfono</label>
                      <input type="tel" value={state.createTenantData.phone} onChange={e => set({ createTenantData: { ...state.createTenantData, phone: e.target.value } })}
                        placeholder="+57 300..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary" />
                    </div>
                  )}
                  {state.tenantMode === 'manual' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Documento ID</label>
                      <input type="text" value={state.manualTenantData.doc_id} onChange={e => set({ manualTenantData: { ...state.manualTenantData, doc_id: e.target.value } })}
                        placeholder="CC, NIT, etc." className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Template */}
          {state.step === 3 && (
            <div className="space-y-4">
              {state.loadingDeps ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <>
                  {state.templates.length === 0 ? (
                    <div className="text-center py-16"><p className="font-bold text-foreground">No hay plantillas disponibles</p></div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {state.templates.map(t => (
                        <button key={t.id} onClick={() => set({ selectedTemplate: t })}
                          className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                            state.selectedTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                          }`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-xl ${state.selectedTemplate?.id === t.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{t.name}</p>
                              <p className="text-[11px] text-muted-foreground">{(t as any).description || ''}</p>
                            </div>
                            {state.selectedTemplate?.id === t.id && <Check className="w-5 h-5 text-primary ml-auto" />}
                          </div>
                          {(t as any).is_public && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Pública</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Fecha de inicio</label>
                      <input type="date" value={state.startDate} onChange={e => set({ startDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Fecha de fin</label>
                      <input type="date" value={state.endDate} onChange={e => set({ endDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Día de pago</label>
                      <select value={state.paymentDay} onChange={e => set({ paymentDay: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary">
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Cláusulas adicionales</label>
                    <textarea value={state.extraClauses} onChange={e => set({ extraClauses: e.target.value })} rows={3}
                      placeholder="Cláusulas extra (opcional)..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary resize-none" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {state.step === 4 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
                <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Revisa el contrato antes de firmar</p>
                <p className="mt-1">Verifica que todos los datos sean correctos. Una vez firmado, no podrás modificarlo.</p>
              </div>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-card overflow-auto max-h-[500px] text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: state.compiledHtml }} />
            </div>
          )}

          {/* Step 5: Signature */}
          {state.step === 5 && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <PenSquare className="w-5 h-5 text-primary" /> Firma del Arrendador
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Firma en el recuadro usando el mouse o touch.</p>
                <div className="bg-white border-2 border-dashed border-border rounded-xl overflow-hidden">
                  <canvas ref={canvasRef} width={600} height={200}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={e => startDraw(e.clientX, e.clientY)}
                    onMouseMove={e => draw(e.clientX, e.clientY)}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={e => startDraw(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={e => draw(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={stopDraw} />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={clearSignature}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent">
                    <X className="w-3 h-3" /> Limpiar
                  </button>
                  {hasSignature && (
                    <span className="flex items-center gap-1 text-xs font-bold text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Firma capturada
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button onClick={() => state.step > 1 ? set({ step: state.step - 1 }) : router.push('/dashboard/landlord')}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" /> {state.step > 1 ? 'Anterior' : 'Cancelar'}
            </button>

            {state.step < 5 ? (
              <button onClick={handleNext} disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/10 transition-all disabled:opacity-40 cursor-pointer">
                {state.step === 3 ? 'Vista Previa' : 'Siguiente'} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={state.isSubmitting || !hasSignature}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-40 cursor-pointer">
                {state.isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Firmar y Enviar</>
                )}
              </button>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
