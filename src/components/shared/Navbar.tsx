'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
  Bell, User, Calendar, DollarSign, Clock, Building2, Check,
  ShieldAlert, LogOut, FileSignature, Info, AlertTriangle,
  CheckCircle2, Ban, ExternalLink, Loader2, Filter, ChevronDown,
  X, Home, MessageSquare, Eye, EyeOff, Trash2, Sun, Moon,
  Search, Menu
} from 'lucide-react';
import { format, parseISO, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppNotification {
  id: string;
  user_id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  read: boolean;
  contract_id: string | null;
  created_at: string;
}

function getTypeIcon(type: string | null) {
  switch (type) {
    case 'success': return { icon: CheckCircle2, cls: 'text-success bg-success/10' };
    case 'warning': return { icon: AlertTriangle, cls: 'text-warning bg-warning/10' };
    case 'danger': return { icon: ShieldAlert, cls: 'text-destructive bg-destructive/10' };
    case 'info': return { icon: Info, cls: 'text-accent bg-accent/10' };
    case 'pago_proximo': return { icon: Clock, cls: 'text-warning bg-warning/10' };
    case 'pago_vencido': return { icon: AlertTriangle, cls: 'text-destructive bg-destructive/10' };
    case 'pago_validado': return { icon: CheckCircle2, cls: 'text-success bg-success/10' };
    case 'pago_registrado': return { icon: DollarSign, cls: 'text-accent bg-accent/10' };
    case 'contrato_pendiente_firma': return { icon: FileSignature, cls: 'text-accent bg-accent/10' };
    case 'contrato_firmado': return { icon: CheckCircle2, cls: 'text-success bg-success/10' };
    case 'contrato_proximo_vencer': return { icon: Clock, cls: 'text-warning bg-warning/10' };
    case 'contrato_vencido': return { icon: Ban, cls: 'text-destructive bg-destructive/10' };
    default: return { icon: Bell, cls: 'text-muted-foreground bg-muted' };
  }
}

function getTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    info: 'Información', warning: 'Advertencia', success: 'Éxito', danger: 'Alerta',
    pago_proximo: 'Pago Próximo', pago_vencido: 'Pago Vencido', pago_validado: 'Pago Validado',
    pago_registrado: 'Pago Registrado',
    contrato_pendiente_firma: 'Firma Pendiente', contrato_firmado: 'Contrato Firmado',
    contrato_proximo_vencer: 'Contrato por Vencer', contrato_vencido: 'Contrato Vencido',
  };
  return labels[type || ''] || 'Notificación';
}

function getNotificationLink(n: AppNotification): string {
  const type = n.type || '';
  if (type.startsWith('contrato_pendiente_firma')) return `/contracts/${n.contract_id}/sign`;
  if (type === 'contrato_firmado' || type === 'contrato_proximo_vencer' || type === 'contrato_vencido') return `/contracts/${n.contract_id}/documents`;
  if (type.startsWith('pago_')) return '/dashboard/payments';
  return '#';
}

const PAGE_TITLES: Record<string, string> = {
  '/properties': 'Mis Propiedades',
  '/tenants': 'Gestión de Inquilinos',
  '/contracts': 'Contratos',
  '/dashboard/payments': 'Pagos',
  '/payments': 'Pagos',
  '/templates': 'Plantillas',
  '/maintenance': 'Incidencias',
  '/settings': 'Configuración',
  '/dashboard/landlord': 'Dashboard',
  '/dashboard/tenant': 'Mi Panel',
};

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    try { await signOut(); router.push('/login'); }
    catch (err) { console.error('Error signing out:', err); }
  };

  const getPageTitle = () => {
    if (pathname.includes('/contracts/new')) return 'Nuevo Contrato';
    if (pathname.match(/\/contracts\/.+\/sign/)) return 'Firmar Contrato';
    if (pathname.match(/\/contracts\/.+\/documents/)) return 'Documentos del Contrato';
    for (const [key, title] of Object.entries(PAGE_TITLES)) {
      if (pathname.includes(key)) return title;
    }
    return 'RentNow';
  };

  const generateNotifications = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const today = new Date();
      const sevenDaysAgo = addDays(today, -7);

      const existsRecent = async (type: string, contractId?: string) => {
        let q = supabase.from('notifications').select('id').eq('type', type).gte('created_at', sevenDaysAgo.toISOString()).limit(1);
        if (contractId) q = q.eq('contract_id', contractId);
        const { data } = await q;
        return (data?.length || 0) > 0;
      };

      if (profile.role === 'arrendatario') {
        const { data: pendingContracts } = await supabase
          .from('contracts').select('id, contract_number, property:properties(title)')
          .eq('tenant_id', user.id).eq('status', 'pendiente_firma').eq('signed_by_tenant', false);
        for (const raw of pendingContracts || []) {
          const c: any = raw;
          if (!(await existsRecent('contrato_pendiente_firma', c.id))) {
            await supabase.from('notifications').insert({ user_id: user.id, contract_id: c.id, type: 'contrato_pendiente_firma', title: 'Contrato pendiente de firma', message: `Tienes un contrato pendiente de firma para ${(Array.isArray(c.property) ? c.property[0]?.title : c.property?.title) || 'la propiedad'}.` });
          }
        }
      }

      if (profile.role === 'arrendatario') {
        const fiveDaysFromNow = addDays(today, 5);
        const { data: upcomingPayments } = await supabase
          .from('payments').select('id, due_date, amount, contract_id').eq('tenant_id', user.id).eq('paid', false);
        for (const p of upcomingPayments || []) {
          const dueDate = parseISO(p.due_date);
          if (isAfter(dueDate, today) && isBefore(dueDate, fiveDaysFromNow)) {
            if (!(await existsRecent('pago_proximo', p.contract_id))) {
              await supabase.from('notifications').insert({
                user_id: user.id, contract_id: p.contract_id, type: 'pago_proximo', title: 'Próximo pago de renta',
                message: `Tu pago de $${p.amount?.toLocaleString('es-CO')} vence el ${format(dueDate, 'dd/MMM/yyyy', { locale: es })}.`,
              });
            }
          }
        }
      }

      const oneDayAgo = addDays(today, -1);
      const { data: overduePayments } = await supabase
        .from('payments').select('id, due_date, amount, contract_id, tenant_id')
        .eq('paid', false).lt('due_date', oneDayAgo.toISOString().split('T')[0])
        .eq('tenant_id', user.id);
      for (const p of overduePayments || []) {
        if (!(await existsRecent('pago_vencido', p.contract_id))) {
          await supabase.from('notifications').insert({
            user_id: user.id, contract_id: p.contract_id, type: 'pago_vencido', title: 'Pago de renta vencido',
            message: `Tienes un pago de $${p.amount?.toLocaleString('es-CO')} vencido desde el ${format(parseISO(p.due_date), 'dd/MMM/yyyy', { locale: es })}.`,
          });
        }
      }

      const thirtyDaysFromNow = addDays(today, 30);
      let endingQuery = supabase
        .from('contracts').select('id, contract_number, end_date, property:properties(title)')
        .in('status', ['activo', 'firmado']).not('end_date', 'is', null)
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0]).gte('end_date', today.toISOString().split('T')[0]);
      if (profile.role === 'arrendatario') endingQuery = endingQuery.eq('tenant_id', user.id);
      else endingQuery = endingQuery.eq('landlord_id', user.id);
      const { data: endingContracts } = await endingQuery;
      for (const raw of endingContracts || []) {
        const c: any = raw;
        if (!(await existsRecent('contrato_proximo_vencer', c.id))) {
          await supabase.from('notifications').insert({
            user_id: user.id, contract_id: c.id, type: 'contrato_proximo_vencer', title: 'Contrato próximo a vencer',
            message: `El contrato #${c.contract_number || c.id.slice(0, 8)} para ${(Array.isArray(c.property) ? c.property[0]?.title : c.property?.title) || 'la propiedad'} vence el ${format(parseISO(c.end_date!), 'dd/MMM/yyyy', { locale: es })}.`,
          });
        }
      }

      let expiredQuery = supabase
        .from('contracts').select('id, contract_number, end_date, property:properties(title)')
        .in('status', ['activo', 'firmado']).not('end_date', 'is', null)
        .lt('end_date', today.toISOString().split('T')[0]);
      if (profile.role === 'arrendatario') expiredQuery = expiredQuery.eq('tenant_id', user.id);
      else expiredQuery = expiredQuery.eq('landlord_id', user.id);
      const { data: expiredContracts } = await expiredQuery;
      for (const raw of expiredContracts || []) {
        const c: any = raw;
        if (!(await existsRecent('contrato_vencido', c.id))) {
          await supabase.from('notifications').insert({
            user_id: user.id, contract_id: c.id, type: 'contrato_vencido', title: 'Contrato vencido',
            message: `El contrato #${c.contract_number || c.id.slice(0, 8)} para ${(Array.isArray(c.property) ? c.property[0]?.title : c.property?.title) || 'la propiedad'} venció el ${format(parseISO(c.end_date!), 'dd/MMM/yyyy', { locale: es })}.`,
          });
        }
      }

      const sevenDaysAgoStr = sevenDaysAgo.toISOString();
      let signedQuery = supabase
        .from('contracts').select('id, contract_number, property:properties(title)')
        .eq('signed_by_landlord', true).eq('signed_by_tenant', true).gte('tenant_signed_at', sevenDaysAgoStr);
      if (profile.role === 'arrendatario') signedQuery = signedQuery.eq('tenant_id', user.id);
      else signedQuery = signedQuery.eq('landlord_id', user.id);
      const { data: signedContracts } = await signedQuery;
      for (const raw of signedContracts || []) {
        const c: any = raw;
        if (!(await existsRecent('contrato_firmado', c.id))) {
          await supabase.from('notifications').insert({
            user_id: user.id, contract_id: c.id, type: 'contrato_firmado', title: 'Contrato firmado',
            message: `El contrato #${c.contract_number || c.id.slice(0, 8)} para ${(Array.isArray(c.property) ? c.property[0]?.title : c.property?.title) || 'la propiedad'} ha sido firmado por ambas partes.`,
          });
        }
      }
    } catch (err) {
      console.error('Error generating notifications:', err);
    }
  }, [user, profile]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;
    fetchNotifications();
    generateNotifications().then(() => fetchNotifications());
    intervalRef.current = setInterval(() => { generateNotifications().then(() => fetchNotifications()); }, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user, profile, fetchNotifications, generateNotifications]);

  useEffect(() => {
    const onFocus = () => { generateNotifications().then(() => fetchNotifications()); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchNotifications, generateNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (n: AppNotification) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error('Error marking notification as read:', err); }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      setNotifications(prev => prev.map(x => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch (err) { console.error('Error marking all as read:', err); }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.read) await handleMarkRead(n);
    const link = getNotificationLink(n);
    if (link && link !== '#') router.push(link);
    setIsOpen(false);
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter !== 'all') return n.type === filter;
    return true;
  });

  const typeFilters = ['all', 'unread', ...new Set(notifications.map(n => n.type).filter(Boolean) as string[])];

  return (
    <header className="h-14 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer mr-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/logo.svg" alt="RentNow" className="h-7 w-auto" />
        </div>
        <div className="hidden md:flex items-center gap-2">
          <img src="/favicon.svg" alt="RentNow" className="h-6 w-6 rounded-md shadow-sm" />
        </div>
        <div className="border-l border-border pl-3 h-8 flex flex-col justify-center">
          <h1 className="text-sm font-semibold text-foreground tracking-tight leading-none">
            {getPageTitle()}
          </h1>
          <p className="hidden md:block text-[9px] text-ink-muted font-medium mt-1 leading-none">
            {format(new Date(), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
          <input id="global-search" name="globalSearch"
            type="text"
            placeholder="Buscar..."
            className="w-44 lg:w-56 bg-muted border border-border text-foreground text-xs rounded-lg pl-8 pr-3 py-1.5 outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-ink-muted/50"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none relative cursor-pointer ${
              isOpen ? 'bg-muted text-foreground' : 'bg-transparent'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-destructive text-white text-[9px] font-bold flex items-center justify-center rounded-full px-1 ring-2 ring-card">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-[340px] md:w-[380px] bg-card border border-border rounded-xl shadow-modal z-50 animate-fade-in origin-top-right flex flex-col max-h-[520px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notificaciones
                  {unreadCount > 0 && (
                    <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
                  )}
                </span>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border overflow-x-auto shrink-0">
                {typeFilters.slice(0, 6).map(t => (
                  <button key={t} onClick={() => setFilter(t)}
                    className={`text-[9px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                      filter === t
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-transparent border-border text-ink-tertiary hover:text-foreground'
                    }`}>
                    {t === 'all' ? 'Todas' : t === 'unread' ? 'No leídas' : getTypeLabel(t)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="p-3 rounded-full bg-muted inline-flex text-muted-foreground"><Bell className="w-6 h-6" /></div>
                    <p className="text-xs font-semibold text-foreground">Sin notificaciones</p>
                    <p className="text-[10px] text-ink-muted max-w-[200px] mx-auto">{filter !== 'all' ? 'No hay con este filtro.' : 'No tienes notificaciones por ahora.'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filtered.map(n => {
                      const { icon: Icon, cls } = getTypeIcon(n.type);
                      return (
                        <div key={n.id} onClick={() => handleNotificationClick(n)}
                          className={`px-4 py-3 hover:bg-muted/50 transition-all cursor-pointer group ${
                            !n.read ? 'bg-primary/[0.03] border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                          }`}>
                          <div className="flex items-start gap-2.5">
                            <div className={`p-1.5 rounded-md shrink-0 ${cls}`}><Icon className="w-3.5 h-3.5" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-[11px] leading-snug ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-ink-tertiary'}`}>{n.title}</p>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                              </div>
                              {n.message && <p className="text-[10px] text-ink-muted mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[8px] font-medium text-ink-muted flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5" />{format(parseISO(n.created_at), 'dd/MMM HH:mm', { locale: es })}
                                </span>
                                <span className="text-[8px] font-medium px-1 py-0.5 rounded border border-border text-ink-tertiary">{getTypeLabel(n.type)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 ml-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.read && <button onClick={(e) => { e.stopPropagation(); handleMarkRead(n); }} className="text-[8px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"><EyeOff className="w-2.5 h-2.5" /> Marcar leída</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-border shrink-0 bg-muted/30 rounded-b-xl">
                  <button onClick={handleMarkAllRead} disabled={unreadCount === 0}
                    className="text-[9px] font-semibold text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer">
                    <Check className="w-3 h-3" /> Marcar todas leídas
                  </button>
                  <span className="text-[8px] text-ink-muted">{notifications.length} en total</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-border ml-0.5">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
            {profile?.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-xs font-medium text-foreground hidden lg:block max-w-[110px] truncate">
            {profile?.full_name || 'Usuario'}
          </span>
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none cursor-pointer"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Logout */}
        <button onClick={handleLogout}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all outline-none cursor-pointer"
          title="Cerrar Sesión">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
