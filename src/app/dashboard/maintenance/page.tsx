'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property, MaintenanceIssue } from '@/types';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Edit2,
  Trash2,
  Loader2,
  Building,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import confetti from 'canvas-confetti';

export default function MaintenancePage() {
  const { user, profile } = useAuth();
  
  const [issues, setIssues] = useState<MaintenanceIssue[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal configuration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<MaintenanceIssue | null>(null);

  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'resolved'>('pending');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchIssuesAndProperties();
    }
  }, [user]);

  const fetchIssuesAndProperties = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch properties
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id);
      setProperties(props || []);

      // 2. Fetch issues with property details
      const { data: damages, error: damagesErr } = await supabase
        .from('maintenance_issues')
        .select(`
          *,
          property:properties (id, title, address)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (damagesErr) throw damagesErr;
      setIssues((damages as any[]) || []);

    } catch (err) {
      console.error('Error fetching maintenance issues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingIssue(null);
    setPropertyId('');
    setTitle('');
    setDescription('');
    setStatus('pending');
    setEstimatedCost('');
    setContractorName('');
    setAdditionalNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (issue: MaintenanceIssue) => {
    setEditingIssue(issue);
    setPropertyId(issue.property_id);
    setTitle(issue.title);
    setDescription(issue.description || '');
    setStatus(issue.status);
    setEstimatedCost(issue.estimated_cost?.toString() || '');
    setContractorName(issue.vendor || '');
    setAdditionalNotes(issue.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteIssue = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de incidencia?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_issues')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setIssues(prev => prev.filter(i => i.id !== id));
      confetti({ particleCount: 50, spread: 60, colors: ['#ef4444', '#f87171'] });
    } catch (err) {
      console.error('Error deleting issue:', err);
      alert('Hubo un problema al intentar eliminar el registro.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!propertyId) {
      alert('Por favor selecciona una propiedad afectada.');
      return;
    }

    setIsSubmitting(true);

    const issuePayload = {
      property_id: propertyId,
      title,
      description: description || '',
      status,
      estimated_cost: estimatedCost ? Number(estimatedCost) : 0,
      vendor: contractorName || null,
      notes: additionalNotes || null,
      reported_date: editingIssue?.reported_date || format(new Date(), 'yyyy-MM-dd'),
      resolved_date: status === 'resolved' ? format(new Date(), 'yyyy-MM-dd') : null
    };

    try {
      if (editingIssue) {
        // Update
        const { error } = await supabase
          .from('maintenance_issues')
          .update(issuePayload)
          .eq('id', editingIssue.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('maintenance_issues')
          .insert({
            user_id: user.id,
            ...issuePayload
          });

        if (error) throw error;
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      setIsModalOpen(false);
      fetchIssuesAndProperties();
    } catch (err: any) {
      console.error('Error saving maintenance issue:', err);
      alert('Hubo un problema al guardar la incidencia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side filtering
  const filteredIssues = issues.filter(issue => {
    const titleMatch = issue.title.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = filterStatus === 'all' || issue.status === filterStatus;
    
    return titleMatch && statusMatch;
  });

  const getStatusBadge = (s: MaintenanceIssue['status']) => {
    switch (s) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" /> Reportado
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> En Reparación
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 bg-success/10 border border-success/20 text-success text-[10px] font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resuelto
          </span>
        );
    }
  };

  const currencySymbol = profile?.preferred_currency || 'USD';

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Incidencias de Inmuebles
          </p>
          <h2 className="text-xl md:text-2xl font-black text-foreground">
            Reportes y Órdenes de Mantenimiento ({issues.length})
          </h2>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/15 transition-all text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Reportar Incidencia</span>
        </button>
      </div>

      {/* Advanced filters */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por título de incidencia o daño..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-1 focus:ring-ring block pl-9 p-2.5 outline-none"
          />
        </div>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-muted text-foreground text-xs font-semibold rounded-lg border border-border p-2.5 w-full md:w-56 outline-none"
        >
          <option value="all">Todos los Estados</option>
          <option value="pending">Reportados (Pendientes)</option>
          <option value="in_progress">En Reparación</option>
          <option value="resolved">Resueltos</option>
        </select>
      </div>

      {/* Damage reports list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-muted rounded-full inline-flex text-muted-foreground">
            <Wrench className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">Sin incidencias registradas</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Todo funciona de maravilla en tus propiedades. Si se presenta un daño o mantenimiento, repórtalo aquí.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIssues.map((issue) => {
            const propName = issue.property?.title || 'Inmueble';
            const propAddress = issue.property?.address || 'Dirección';

            return (
              <div
                key={issue.id}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider font-mono">
                      INCIDENCIA: #{issue.id.substring(0, 6).toUpperCase()}
                    </span>
                    {getStatusBadge(issue.status)}
                  </div>

                  <h3 className="font-extrabold text-base text-foreground">
                    {issue.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 leading-relaxed">
                    <Building className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{propName}</span>
                    <span className="text-muted-foreground truncate">— {propAddress}</span>
                  </p>
                </div>

                {/* Description details */}
                {issue.description && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-3.5 rounded-lg border border-border/60 leading-relaxed">
                    {issue.description}
                  </p>
                )}

                {/* Repair costs & contractors */}
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-1">
                      Contratista / Técnico
                    </span>
                    <span className="font-bold text-foreground block truncate flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                      {issue.vendor || 'Sin asignar'}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-1">
                      Costo Estimado
                    </span>
                    <span className="font-black text-foreground block">
                      {issue.estimated_cost ? `${currencySymbol} ${Number(issue.estimated_cost).toLocaleString()}` : 'Sin cotizar'}
                    </span>
                  </div>
                </div>

                {/* Custom notes */}
                {issue.notes && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">
                      Observaciones / Detalles Técnicos
                    </span>
                    <p className="p-3 bg-muted rounded-lg text-[10px] text-muted-foreground leading-relaxed italic border border-border/50">
                      {issue.notes}
                    </p>
                  </div>
                )}

                {/* Date and Action controls */}
                <div className="flex items-center justify-between border-t border-border pt-4 text-xs mt-auto">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Reporte: {issue.reported_date || format(new Date(issue.created_at), 'yyyy-MM-dd')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(issue)}
                      className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer animate-scale-up"
                      title="Editar Incidencia"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="p-2 rounded-lg border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all cursor-pointer animate-scale-up"
                      title="Eliminar Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up my-8">
            
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                {editingIssue ? 'Editar Incidencia' : 'Reportar Daño / Reparación'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Step 1: Select Property */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Propiedad Afectada
                </label>
                <select
                  required
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring"
                >
                  <option value="">Selecciona Propiedad...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Title details */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Título Breve del Daño
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Gotera en techo cocina, Fuga de agua"
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none focus:ring-1 focus:ring-ring font-semibold"
                />
              </div>

              {/* Step 3: Description details */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Descripción Detallada
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre la falla, gravedad de la situación y qué requiere reparación inmediata..."
                  rows={3}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none resize-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Step 4: Status and estimated cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Estado Actual
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring"
                  >
                    <option value="pending">Reportada / Pendiente</option>
                    <option value="in_progress">En Reparación / Proceso</option>
                    <option value="resolved">Resuelta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Presupuesto Estimado ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="Ej: 150000"
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none focus:ring-1 focus:ring-ring font-semibold"
                  />
                </div>
              </div>

              {/* Step 5: Contractor details */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Nombre del Técnico / Contratista (Opcional)
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="Ej: Pedro Fontanero, Plomería Express"
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Step 6: Notes */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Observaciones / Teléfono / Detalles Adicionales
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Detalles de contacto, fecha de visita acordada, costo final real o notas del trabajo..."
                  rows={2}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none resize-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || properties.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Registro</span>
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
