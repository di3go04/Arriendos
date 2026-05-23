'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SmartInput } from '@/components/ui/SmartInput';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { MaintenanceIssue,Property } from '@/types';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { AnimatePresence,motion } from 'framer-motion';
import {
AlertTriangle,
Briefcase,
Building,
Calendar,
CheckCircle2,
Clock,
Edit2,
Loader2,
Plus,
Search,
Trash2,
Wrench,
X
} from 'lucide-react';
import React,{ useEffect,useState } from 'react';

export default function MaintenancePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
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
      setIssues((damages as MaintenanceIssue[]) || []);

    } catch (err) {
      console.error('Error fetching maintenance issues:', err);
      toast({ type: 'error', message: 'Error al cargar las incidencias de mantenimiento.' });
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

  const handleDeleteIssue = (id: string) => {
    const issueToDelete = issues.find(i => i.id === id);
    if (!issueToDelete) return;

    // Optimistic UI Update
    setIssues(prev => prev.filter(i => i.id !== id));
    
    let cancelled = false;
    toast({
      type: 'success',
      message: 'Incidencia eliminada.',
      onUndo: () => {
        cancelled = true;
        setIssues(prev => [issueToDelete, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    });

    setTimeout(async () => {
      if (!cancelled) {
        try {
          const { error } = await supabase.from('maintenance_issues').delete().eq('id', id);
          if (error) throw error;
          confetti({ particleCount: 50, spread: 60, colors: ['#ef4444', '#f87171'] });
        } catch (err) {
          console.error('Error deleting issue:', err);
          setIssues(prev => [issueToDelete, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          toast({ type: 'error', message: 'Hubo un problema al intentar eliminar en la nube.' });
        }
      }
    }, 5500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!propertyId) {
      toast({ type: 'warning', message: 'Por favor selecciona una propiedad afectada.' });
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
    } catch (err: unknown) {
      console.error('Error saving maintenance issue:', err);
      toast({ type: 'error', message: 'Hubo un problema al guardar la incidencia.' });
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Reportar Incidencia</span>
        </button>
      </div>

      {/* Advanced filters */}
      <div className="bg-card border-none p-4 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 w-full xl:w-auto">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por título de incidencia o daño..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 block pl-9 p-2.5 outline-none transition-all placeholder:text-ink-muted"
          />
        </div>

        {/* Status Segmented Control */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Reportados' },
            { id: 'in_progress', label: 'En Reparación' },
            { id: 'resolved', label: 'Resueltos' }
          ].map(fs => (
            <button
              key={fs.id}
              onClick={() => setFilterStatus(fs.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border-none ${
                filterStatus === fs.id
                  ? 'bg-foreground text-background shadow-[0_2px_8px_rgba(37,99,235,0.2)]'
                  : 'bg-background text-ink-muted hover:bg-muted hover:text-foreground'
              }`}
            >
              {fs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Damage reports list */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filteredIssues.length === 0 ? (
        <EmptyState 
          icon={<Wrench className="w-16 h-16" />}
          title="Sin incidencias registradas"
          description="Todo funciona de maravilla en tus propiedades. Si se presenta un daño o mantenimiento, repórtalo aquí."
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
            {filteredIssues.map((issue) => {
            const propName = issue.property?.title || 'Inmueble';
            const propAddress = issue.property?.address || 'Dirección';

            return (
              <motion.div
                key={issue.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border-none rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between space-y-5"
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
                    <span className="font-black text-foreground block tabular-nums text-primary">
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
                      className="p-2 rounded-lg border-none bg-muted hover:bg-muted/80 text-ink-muted hover:text-foreground transition-all cursor-pointer shadow-sm"
                      title="Editar Incidencia"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="p-2 rounded-lg border-none bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                      title="Eliminar Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border-none rounded-3xl w-full max-w-lg shadow-[0_25px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up my-8">
            
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as typeof status)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring"
                  >
                    <option value="pending">Reportada / Pendiente</option>
                    <option value="in_progress">En Reparación / Proceso</option>
                    <option value="resolved">Resuelta</option>
                  </select>
                </div>

                <SmartInput
                  label={`Presupuesto Estimado (${currencySymbol})`}
                  value={estimatedCost}
                  onChange={setEstimatedCost}
                  formatType="currency"
                  placeholder="Ej: $ 150.000"
                />
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
