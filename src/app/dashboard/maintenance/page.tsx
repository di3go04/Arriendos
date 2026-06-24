'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('MAINTENANCE_PAGE');
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchIssuesAndProperties() {
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
      toast({ type: 'error', message: t('fetch_error') });
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
      message: t('deleted_toast'),
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
          toast({ type: 'error', message: t('delete_cloud_error') });
        }
      }
    }, 5500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!propertyId) {
      toast({ type: 'warning', message: t('select_property_warning') });
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
      toast({ type: 'error', message: t('save_error') });
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
            <AlertTriangle className="w-3.5 h-3.5" /> {t('status_reported')}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> {t('status_in_progress')}
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 bg-success/10 border border-success/20 text-success text-[10px] font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('status_resolved')}
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
            {t('section_subtitle')}
          </p>
          <h2 className="text-xl md:text-2xl font-black text-foreground">
            {t('page_title', { count: issues.length })}
          </h2>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('report_button')}</span>
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
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 block pl-9 p-2.5 outline-none transition-all placeholder:text-ink-muted"
          />
        </div>

        {/* Status Segmented Control */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: t('filter_all') },
            { id: 'pending', label: t('filter_pending') },
            { id: 'in_progress', label: t('filter_in_progress') },
            { id: 'resolved', label: t('filter_resolved') }
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
          title={t('empty_title')}
          description={t('empty_description')}
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
            const propName = issue.property?.title || t('property_fallback');
            const propAddress = issue.property?.address || t('address_fallback');

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
                      {t('issue_prefix')} #{issue.id.substring(0, 6).toUpperCase()}
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
                      {t('contractor_label')}
                    </span>
                    <span className="font-bold text-foreground block truncate flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                      {issue.vendor || t('unassigned')}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-1">
                      {t('estimated_cost_label')}
                    </span>
                    <span className="font-black text-foreground block tabular-nums text-primary">
                      {issue.estimated_cost ? `${currencySymbol} ${Number(issue.estimated_cost).toLocaleString()}` : t('no_quote')}
                    </span>
                  </div>
                </div>

                {/* Custom notes */}
                {issue.notes && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">
                      {t('notes_label')}
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
                    {t('report_label')}: {issue.reported_date || format(new Date(issue.created_at), 'yyyy-MM-dd')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(issue)}
                      className="p-2 rounded-lg border-none bg-muted hover:bg-muted/80 text-ink-muted hover:text-foreground transition-all cursor-pointer shadow-sm"
                      title={t('edit_issue_title')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="p-2 rounded-lg border-none bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                      title={t('delete_issue_title')}
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
                {editingIssue ? t('modal_edit_title') : t('modal_create_title')}
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
                  {t('affected_property_label')}
                </label>
                <select
                  required
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring"
                >
                  <option value="">{t('select_property_placeholder')}</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Title details */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('short_title_label')}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('title_placeholder')}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none focus:ring-1 focus:ring-ring font-semibold"
                />
              </div>

              {/* Step 3: Description details */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('detailed_description_label')}
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('description_placeholder')}
                  rows={3}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none resize-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Step 4: Status and estimated cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t('current_status_label')}
                  </label>
                  <select
                    value={status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as typeof status)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none font-semibold focus:ring-1 focus:ring-ring"
                  >
                    <option value="pending">{t('status_option_pending')}</option>
                    <option value="in_progress">{t('status_option_in_progress')}</option>
                    <option value="resolved">{t('status_option_resolved')}</option>
                  </select>
                </div>

                <SmartInput
                  label={t('estimated_budget_label', { currency: currencySymbol })}
                  value={estimatedCost}
                  onChange={setEstimatedCost}
                  formatType="currency"
                  placeholder={t('budget_placeholder')}
                />
              </div>

              {/* Step 5: Contractor details */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('contractor_name_label')}
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder={t('contractor_placeholder')}
                  className="w-full bg-muted border border-border text-foreground text-xs rounded-lg p-3 outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Step 6: Notes */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('additional_notes_label')}
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder={t('notes_placeholder')}
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
                  {t('modal_cancel_button')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || properties.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('saving_button')}</span>
                    </>
                  ) : (
                    <span>{t('save_button')}</span>
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
