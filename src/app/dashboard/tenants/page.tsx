'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Loader2,
  FileText,
  UserCheck,
  UserX,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function TenantsPage() {
  const { user } = useAuth();
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all'); // all, active, inactive

  useEffect(() => {
    if (user) {
      fetchTenants();
    }
  }, [user]);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      // Query profiles of type 'arrendatario' joining their contracts history
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          contracts:contracts!contracts_tenant_id_fkey (
            id,
            contract_number,
            status,
            monthly_rent,
            property:properties (
              id,
              title,
              address
            )
          )
        `)
        .eq('role', 'arrendatario')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (err) {
      console.error('Error fetching tenants profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering logic
  const filteredTenants = tenants.filter(t => {
    const q = searchQuery.toLowerCase();
    const nameMatch = t.full_name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || (t.phone && t.phone.toLowerCase().includes(q));
    
    // Check if tenant has at least one active contract
    const hasActiveContract = t.contracts?.some((c: any) => c.status === 'activo');
    
    let stateMatch = true;
    if (filterState === 'active') stateMatch = hasActiveContract;
    if (filterState === 'inactive') stateMatch = !hasActiveContract;

    return nameMatch && stateMatch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Directorio de Usuarios
          </p>
          <h2 className="text-xl md:text-2xl font-black text-foreground">
            Inquilinos Registrados en RentNow ({tenants.length})
          </h2>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar inquilino por nombre, email o celular..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-1 focus:ring-ring block pl-9 p-2.5 outline-none"
          />
        </div>

        {/* State filter */}
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="bg-muted text-foreground text-xs font-semibold rounded-lg border border-border p-2.5 w-full md:w-52 outline-none cursor-pointer"
        >
          <option value="all">Cualquier Estado de Renta</option>
          <option value="active">Con Contrato Activo</option>
          <option value="inactive">Sin Contrato Activo (Disponible)</option>
        </select>
      </div>

      {/* Tenants Table Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="py-16 text-center bg-card border border-dashed border-border rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-muted rounded-full inline-flex text-muted-foreground">
            <Users className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">No se encontraron inquilinos</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Asegúrate de que tus inquilinos se registren en la plataforma seleccionando el rol de &quot;Arrendatario&quot;.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((t) => {
            // Find if there is an active lease
            const activeContract = t.contracts?.find((c: any) => c.status === 'activo');
            const hasActive = !!activeContract;

            return (
              <div
                key={t.id}
                className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-muted-foreground/30 transition-all flex flex-col justify-between space-y-5"
              >
                
                {/* Header Profile info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 relative overflow-hidden font-black text-sm uppercase">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.full_name} className="w-full h-full object-cover" />
                      ) : (
                        t.full_name?.slice(0, 2) || 'IQ'
                      )}
                    </div>

                    {hasActive ? (
                      <span className="inline-flex items-center gap-1 bg-success/10 border border-success/20 text-success text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        <UserCheck className="w-3 h-3" /> Arrendando
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-muted border border-border text-muted-foreground text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        <UserX className="w-3 h-3" /> Disponible
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-sm text-foreground truncate">
                      {t.full_name || 'Inquilino sin nombre'}
                    </h3>
                    <span className="text-[10px] text-muted-foreground block">
                      Miembro desde: {new Date(t.created_at).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* Contact list details */}
                <div className="space-y-2 text-xs border-y border-border/50 py-3 text-muted-foreground">
                  <a
                    href={`mailto:${t.email}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors hover:underline truncate"
                  >
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span>{t.email}</span>
                  </a>
                  
                  {t.phone ? (
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`tel:${t.phone}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors hover:underline truncate"
                      >
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <span>{t.phone}</span>
                      </a>
                      
                      <a
                        href={`https://wa.me/${t.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-success/10 border border-success/20 text-success hover:bg-success hover:text-success-foreground transition-all cursor-pointer"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-muted-foreground block">
                      Sin teléfono registrado
                    </span>
                  )}
                </div>

                {/* Lease status details */}
                <div className="text-xs">
                  {hasActive ? (
                    <div className="p-3 bg-success/5 border border-success/10 rounded-xl space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-success tracking-wider block">
                        Contrato Activo:
                      </span>
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground block truncate">
                          {activeContract.property?.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          Renta: ${activeContract.monthly_rent?.toLocaleString('es-CO')}/mes
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-center text-muted-foreground italic text-[10px]">
                      Sin contratos activos vinculados
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
