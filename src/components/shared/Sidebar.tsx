'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Building2, FileText, DollarSign,
  Wrench, Settings, LogOut, User as UserIcon, FileCode,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
  onToggle?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  className = '',
  isOpenMobile = false,
  onCloseMobile
}: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      href: profile?.role === 'arrendador' ? '/dashboard/landlord'
        : profile?.role === 'arrendatario' ? '/dashboard/tenant' : '/dashboard',
      icon: LayoutDashboard
    },
    ...(profile?.role === 'arrendador'
      ? [
          { name: 'Mis Propiedades', href: '/properties', icon: Building2 },
          { name: 'Plantillas', href: '/templates', icon: FileCode }
        ]
      : []
    ),
    {
      name: profile?.role === 'arrendador' ? 'Contratos' : 'Mi Contrato',
      href: '/dashboard/leases', icon: FileText
    },
    {
      name: profile?.role === 'arrendador' ? 'Pagos' : 'Mis Pagos',
      href: '/dashboard/payments', icon: DollarSign
    },
    ...(profile?.role === 'arrendador'
      ? [{ name: 'Incidencias', href: '/dashboard/maintenance', icon: Wrench }]
      : [{ name: 'Reportar Daño', href: '/dashboard/maintenance', icon: Wrench }]
    ),
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-45 transition-opacity duration-300 animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-60'
        } bg-card border-r border-border flex flex-col h-screen fixed md:sticky inset-y-0 left-0 z-50 md:z-20 transition-all duration-300 shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${className}`}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-border flex items-center justify-between">
          <Link
            href={profile?.role === 'arrendador' ? '/dashboard/landlord' : '/dashboard/tenant'}
            onClick={onCloseMobile}
            className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2.5'}`}
          >
            {collapsed ? (
              <img src="/favicon.svg" alt="RentNow" className="w-8 h-8 rounded-lg shadow-sm" />
            ) : (
              <img src="/logo.svg" alt="RentNow" className="h-8 w-auto text-foreground" />
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-ink-tertiary hover:bg-muted hover:text-foreground'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                {!collapsed && <span>{item.name}</span>}
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User panel */}
        <div className="p-2 border-t border-border">
          <div className={`flex items-center gap-2.5 px-2 py-2 mb-1.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 text-xs font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground truncate">
                  {profile?.full_name || 'Usuario'}
                </span>
                <span className="block text-[10px] text-ink-muted truncate uppercase tracking-wider font-medium">
                  {profile?.role === 'arrendador' ? 'Arrendador' : 'Inquilino'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              signOut();
            }}
            className={`w-full flex items-center gap-2 py-2 rounded-lg border border-border text-xs font-medium text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all cursor-pointer ${collapsed ? 'justify-center' : 'justify-center'}`}
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
