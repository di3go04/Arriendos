'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Property, Profile, ContractTemplate } from '@/types';

export interface WizardState {
  step: number;
  properties: Property[];
  templates: ContractTemplate[];
  loadingDeps: boolean;
  selectedProperty: Property | null;
  tenantMode: 'search' | 'create' | 'manual';
  tenantSearchQuery: string;
  tenantResults: Profile[];
  selectedTenant: Profile | null;
  createTenantData: { full_name: string; email: string; phone: string };
  manualTenantData: { full_name: string; email: string; doc_id: string };
  searchingTenant: boolean;
  selectedTemplate: ContractTemplate | null;
  startDate: string;
  endDate: string;
  paymentDay: string;
  extraClauses: string;
  compiledHtml: string;
  isDrawing: boolean;
  hasSignature: boolean;
  isSubmitting: boolean;
  errorMsg: string;
  contractNumber: string;
}

export function useWizardState(user: { id: string; email?: string | null } | null, profile: { full_name?: string | null; email?: string | null } | null) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    properties: [],
    templates: [],
    loadingDeps: true,
    selectedProperty: null,
    tenantMode: 'search',
    tenantSearchQuery: '',
    tenantResults: [],
    selectedTenant: null,
    createTenantData: { full_name: '', email: '', phone: '' },
    manualTenantData: { full_name: '', email: '', doc_id: '' },
    searchingTenant: false,
    selectedTemplate: null,
    startDate: '',
    endDate: '',
    paymentDay: '5',
    extraClauses: '',
    compiledHtml: '',
    isDrawing: false,
    hasSignature: false,
    isSubmitting: false,
    errorMsg: '',
    contractNumber: '',
  });

  const set = (partial: Partial<WizardState>) => setState(prev => ({ ...prev, ...partial }));

  // Prefill
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    set({ startDate: new Date().toISOString().split('T')[0], contractNumber: `CON-${Date.now().toString().slice(-6)}` });
  }, []);

  // Fetch dependencies
  useEffect(() => {
    if (!user) return;
    (async () => {
      set({ loadingDeps: true });
      try {
        const [propsRes, tempsRes] = await Promise.all([
          supabase.from('properties').select('*').eq('owner_id', user.id).neq('status', 'inactivo').order('created_at', { ascending: false }),
          supabase.from('contract_templates').select('*').or(`owner_id.eq.${user.id},is_public.eq.true`).order('created_at', { ascending: false }),
        ]);
        if (propsRes.error) throw propsRes.error;
        if (tempsRes.error) throw tempsRes.error;
        set({ properties: propsRes.data || [], templates: tempsRes.data || [] });
      } catch {
        set({ errorMsg: 'Error al cargar datos del formulario.' });
      } finally { set({ loadingDeps: false }); }
    })();
  }, [user]);

  // Auto-fill end date
  useEffect(() => {
    if (state.selectedProperty && state.startDate) {
      const end = new Date(state.startDate);
      end.setFullYear(end.getFullYear() + 1);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      set({ endDate: end.toISOString().split('T')[0] });
    }
  }, [state.selectedProperty, state.startDate]);

  // Debounced tenant search
  useEffect(() => {
    if (state.tenantMode !== 'search' || !state.tenantSearchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      set({ tenantResults: [] }); return;
    }
    const timer = setTimeout(async () => {
      set({ searchingTenant: true });
      const { data } = await supabase.from('profiles').select('*').eq('role', 'arrendatario')
        .ilike('full_name', `%${state.tenantSearchQuery}%`).limit(10);
      set({ tenantResults: data || [], searchingTenant: false });
    }, 400);
    return () => clearTimeout(timer);
  }, [state.tenantSearchQuery, state.tenantMode]);

  const compileTemplate = useCallback(() => {
    if (!state.selectedTemplate || !state.selectedProperty || !profile) return '';
    const prop = state.selectedProperty;
    const name = state.selectedTenant?.full_name || state.manualTenantData.full_name || 'ARRENDATARIO';
    const docId = state.manualTenantData.doc_id || 'Pendiente';
    let result = state.selectedTemplate.content;

    const vars: Record<string, string> = {
      ARRENDADOR: profile.full_name || profile.email || 'ARRENDADOR',
      ARRENDATARIO: name,
      ARRENDATARIO_DOC: docId,
      PROPIEDAD_DIRECCION: prop.address || 'Dirección',
      PROPIEDAD_CIUDAD: prop.city || 'Ciudad',
      PROPIEDAD_TIPO: prop.type || 'casa',
      MONTO: String(prop.monthly_rent || 0),
      FECHA_INICIO: state.startDate,
      FECHA_FIN: state.endDate,
      DIA_PAGO: state.paymentDay,
      CONTRATO_NUM: state.contractNumber,
    };

    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${k}}}`, 'g'), v);
    }
    return result;
  }, [state.selectedTemplate, state.selectedProperty, profile, state.selectedTenant, state.manualTenantData, state.startDate, state.endDate, state.paymentDay, state.contractNumber]);

  const canGoNext = () => {
    switch (state.step) {
      case 1: return !!state.selectedProperty;
      case 2: return !!state.selectedTenant || !!state.manualTenantData.full_name;
      case 3: return !!state.selectedTemplate && !!state.startDate;
      case 4: return state.compiledHtml.length > 0;
      default: return false;
    }
  };

  const hasSubmitErrors = () => {
    if (!state.selectedProperty) return 'Debes seleccionar una propiedad.';
    if (!state.selectedTenant && !state.manualTenantData.full_name) return 'Debes seleccionar un arrendatario.';
    if (!state.selectedTemplate) return 'Debes seleccionar una plantilla.';
    if (!state.hasSignature) return 'Debes capturar tu firma.';
    return null;
  };

  return { state, set, compileTemplate, canGoNext, hasSubmitErrors };
}

export const STEPS = [
  { num: 1, label: 'Propiedad', icon: 'Building2' },
  { num: 2, label: 'Arrendatario', icon: 'User' },
  { num: 3, label: 'Plantilla', icon: 'FileText' },
  { num: 4, label: 'Revisión', icon: 'ClipboardCheck' },
  { num: 5, label: 'Firma', icon: 'PenSquare' },
];

export const TYPE_ICONS: Record<string, string> = {
  casa: 'Home', apartamento: 'Building2', local: 'Store', oficina: 'Briefcase', terreno: 'TreePine',
};
