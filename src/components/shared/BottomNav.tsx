'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  Menu,
  X,
  Users,
  FileText,
  Wrench,
  Settings,
  LogOut,
  User as UserIcon,
  FileCode
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamic tabs configuration based on role
  const isLandlord = profile?.role === 'arrendador';

  const mainTabs = isLandlord
    ? [
        { name: 'Dashboard', href: '/dashboard/landlord', icon: LayoutDashboard },
        { name: 'Propiedades', href: '/properties', icon: Building2 },
        { name: 'Cobros', href: '/dashboard/payments', icon: DollarSign },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard/tenant', icon: LayoutDashboard },
        { name: 'Mi Contrato', href: '/dashboard/leases', icon: FileText },
        { name: 'Mis Pagos', href: '/dashboard/payments', icon: DollarSign },
      ];

  const moreTabs = isLandlord
    ? [
        { name: 'Inquilinos', href: '/dashboard/tenants', icon: Users },
        { name: 'Plantillas', href: '/templates', icon: FileCode },
        { name: 'Contratos', href: '/dashboard/leases', icon: FileText },
        { name: 'Incidencias', href: '/dashboard/maintenance', icon: Wrench },
        { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
      ]
    : [
        { name: 'Reportar Daño', href: '/dashboard/maintenance', icon: Wrench },
        { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
      ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex items-center justify-around px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.15)] pb-safe">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-primary rounded-b" />
              )}
              <Icon className="w-5.5 h-5.5 mb-1 active:scale-95 transition-transform" />
              <span className="text-[10px] font-semibold">{tab.name}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all relative outline-none ${
            isMenuOpen ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {isMenuOpen && (
            <span className="absolute top-0 w-8 h-1 bg-primary rounded-b" />
          )}
          {isMenuOpen ? (
            <X className="w-5.5 h-5.5 mb-1 animate-spin-once" />
          ) : (
            <Menu className="w-5.5 h-5.5 mb-1 active:scale-95 transition-transform" />
          )}
          <span className="text-[10px] font-semibold">Más</span>
        </button>
      </div>

      {/* Slide-Up Drawer for 'More' */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-all flex items-end animate-fade-in" onClick={() => setIsMenuOpen(false)}>
          <div
            className="w-full bg-card rounded-t-3xl border-t border-border p-6 shadow-2xl space-y-6 pb-24 max-h-[75vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer handle indicator */}
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto -mt-2 mb-4" />

            {/* Title / User info */}
            <div className="flex items-center gap-3 p-2 border-b border-border pb-4">
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
              <div>
                <span className="block text-sm font-bold text-foreground">
                  {profile?.full_name || 'Usuario Arrendo'}
                </span>
                <span className="block text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  {isLandlord ? '👑 Arrendador' : '🏡 Inquilino'}
                </span>
              </div>
            </div>

            {/* Grid menu */}
            <div className="grid grid-cols-2 gap-3.5">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname.startsWith(tab.href);

                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-md shadow-primary/10'
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-semibold">{tab.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                signOut();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all cursor-pointer mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
