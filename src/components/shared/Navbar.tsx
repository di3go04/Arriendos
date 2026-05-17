'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Bell, User as UserIcon, Calendar, DollarSign, Clock, Building2, Check, ShieldAlert, LogOut } from 'lucide-react';
import { Payment } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationAlert {
  id: string;
  type: 'overdue' | 'upcoming';
  title: string;
  content: string;
  date: string;
  paymentId: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Derive dynamic page title
  const getPageTitle = () => {
    if (pathname.includes('/properties')) return 'Mis Propiedades';
    if (pathname.includes('/tenants')) return 'Gestión de Inquilinos';
    if (pathname.includes('/leases')) return 'Contratos de Alquiler';
    if (pathname.includes('/payments')) return 'Seguimiento de Pagos';
    if (pathname.includes('/maintenance')) return 'Incidencias y Reportes';
    if (pathname.includes('/settings')) return 'Configuración General';
    return 'Panel de Resumen';
  };

  // Fetch real-time billing alerts
  const fetchAlerts = async () => {
    if (!user) return;
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Query pending/overdue payments
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          due_date,
          amount,
          status,
          lease:leases (
            tenant:tenants (full_name),
            property:properties (name)
          )
        `)
        .eq('user_id', user.id)
        .or('status.eq.pending,status.eq.overdue')
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      if (data) {
        const formattedAlerts: NotificationAlert[] = data.map((p: any) => {
          const tenantName = p.lease?.tenant?.full_name || 'Inquilino';
          const propName = p.lease?.property?.name || 'Inmueble';
          const isOverdue = new Date(p.due_date) < new Date() && p.status !== 'paid';

          return {
            id: p.id,
            type: isOverdue ? 'overdue' : 'upcoming',
            title: isOverdue ? 'Alerta de Pago Vencido' : 'Cobro Próximo a Vencer',
            content: `El inquilino ${tenantName} tiene un pago de ${profile?.preferred_currency || '$'}${Number(p.amount).toLocaleString()} pendiente para el inmueble ${propName}.`,
            date: p.due_date,
            paymentId: p.id,
          };
        });
        setNotifications(formattedAlerts);
      }
    } catch (err) {
      console.error('Error fetching billing alerts for notifications:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts periodically or on focus
    window.addEventListener('focus', fetchAlerts);
    return () => window.removeEventListener('focus', fetchAlerts);
  }, [user, profile]);

  // Click outside utility
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header className="h-18 bg-card/85 backdrop-blur-md border-b border-border flex items-center justify-between px-6 md:px-8 sticky top-0 z-20">
      
      {/* Dynamic title page */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {getPageTitle()}
        </h1>
        <p className="hidden md:block text-[11px] text-muted-foreground font-semibold mt-0.5">
          {format(new Date(), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        
        {/* Real-time Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all outline-none relative cursor-pointer ${
              isOpen ? 'bg-muted text-foreground' : 'bg-transparent'
            }`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card ring-1 ring-destructive/20 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50 animate-slide-up origin-top-right">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> Notificaciones Internas
                </span>
                {notifications.length > 0 && (
                  <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notifications.length} Alertas
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2.5">
                  <Check className="w-8 h-8 text-success" />
                  <p className="text-xs font-semibold">¡Todo al día!</p>
                  <p className="text-[10px]">No tienes cobros morosos ni alertas activas.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs relative group ${
                        n.type === 'overdue'
                          ? 'bg-destructive/5 border-destructive/10 hover:border-destructive/20'
                          : 'bg-warning/5 border-warning/10 hover:border-warning/20'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 pr-6">
                        {n.type === 'overdue' ? (
                          <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-foreground mb-0.5">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {n.content}
                          </p>
                          <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vence: {format(new Date(n.date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* Close mark as read */}
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Marcar como leída"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Short Profile Badge (Desktop) */}
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-border h-8">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
            {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <span className="block text-xs font-bold text-foreground">
              {profile?.full_name || 'Arrendador'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all outline-none cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>

      </div>
    </header>
  );
}
