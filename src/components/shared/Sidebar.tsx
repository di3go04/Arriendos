'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  DollarSign,
  Wrench,
  Settings,
  LogOut,
  User as UserIcon,
  FileCode
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  // Dynamically configure menu options based on role
  const menuItems = [
    {
      name: 'Dashboard',
      href: profile?.role === 'arrendador'
        ? '/dashboard/landlord'
        : profile?.role === 'arrendatario'
        ? '/dashboard/tenant'
        : '/dashboard',
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
      href: '/dashboard/leases',
      icon: FileText
    },
    {
      name: profile?.role === 'arrendador' ? 'Pagos' : 'Mis Pagos',
      href: '/dashboard/payments',
      icon: DollarSign
    },
    ...(profile?.role === 'arrendador'
      ? [{ name: 'Incidencias', href: '/dashboard/maintenance', icon: Wrench }]
      : [{ name: 'Reportar Daño', href: '/dashboard/maintenance', icon: Wrench }]
    ),
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className={`w-72 bg-card border-r border-border flex flex-col h-screen sticky top-0 shrink-0 ${className}`}>
      
      {/* Brand logo */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <Building2 className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-foreground block">
            Arrendo
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">
            Proptech Premium
          </span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-foreground rounded-r" />
              )}
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
              }`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile summary & Sign Out */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold text-foreground truncate">
              {profile?.full_name || 'Usuario Arrendo'}
            </span>
            <span className="block text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">
              {profile?.role === 'arrendador' ? '👑 Arrendador' : '🏡 Inquilino'}
            </span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-xs font-semibold text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
