'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2, ExternalLink, Filter, Loader2, Mail, MessageSquare,
  Phone, RefreshCw, Search, Trash2, User
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Lead {
  id: string;
  property_id: string;
  owner_id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  lead_message: string;
  property_title: string;
  created_at: string;
  status: string;
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    loadLeads();
  }, [user]);

  async function loadLeads() {
    setLoading(true);
    const { data } = await supabase
      .from('property_leads')
      .select('*, properties(title)')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) {
      setLeads(data.map((l: any) => ({
        ...l,
        property_title: l.properties?.title || 'Sin propiedad',
      })));
    }
    setLoading(false);
  }

  async function deleteLead(id: string) {
    await supabase.from('property_leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  }

  const filtered = leads.filter(l => {
    const matchesSearch = !search ||
      l.lead_name.toLowerCase().includes(search.toLowerCase()) ||
      l.lead_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-foreground">Leads</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {leads.length} leads recibidos
            </p>
          </div>
          <button onClick={loadLeads} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="converted">Convertido</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm font-semibold text-muted-foreground">No hay leads</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Los leads aparecerán cuando alguien solicite info de tus propiedades.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(lead => (
              <div key={lead.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {lead.lead_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{lead.lead_name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <a href={`mailto:${lead.lead_email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {lead.lead_email}
                        </a>
                        {lead.lead_phone && (
                          <a href={`tel:${lead.lead_phone}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.lead_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}
                    </span>
                    <button onClick={() => deleteLead(lead.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {lead.lead_message && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-muted/50">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{lead.lead_message}</p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <Link href={`/propiedades/${lead.property_id}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    <Building2 className="w-3 h-3" /> {lead.property_title}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <select
                    value={lead.status || 'new'}
                    onChange={async (e) => {
                      await supabase.from('property_leads').update({ status: e.target.value }).eq('id', lead.id);
                      loadLeads();
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg border border-border bg-background text-foreground outline-none cursor-pointer"
                  >
                    <option value="new">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="converted">Convertido</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
