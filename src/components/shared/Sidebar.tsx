'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
Building2,
ChevronLeft,
DollarSign,
FileCode,
FileSpreadsheet,
FileText,
Home,
LayoutDashboard,
LogOut,
Moon,
Settings,
ShieldCheck,Sun,
Tag,
User as UserIcon,
Wrench
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
  onToggle?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const menuItems = [
  { label: 'Inicio', icon: Home, href: () => '/', roles: ['arrendador', 'arrendatario', 'admin'] },
  { label: 'Dashboard', icon: LayoutDashboard, href: (role: string) => role === 'arrendador' ? '/dashboard/landlord' : '/dashboard/tenant' },
  { label: 'Propiedades', icon: Building2, href: () => '/properties', roles: ['arrendador'] },
  { label: 'Plantillas', icon: FileCode, href: () => '/templates', roles: ['arrendador'] },
  { label: 'Contratos', icon: FileText, href: () => '/dashboard/leases' },
  { label: 'Pagos', icon: DollarSign, href: () => '/dashboard/payments' },
  { label: 'Gastos', icon: DollarSign, href: () => '/dashboard/expenses', roles: ['arrendador'] },
  { label: 'Reportes', icon: FileSpreadsheet, href: () => '/dashboard/reports', roles: ['arrendador'] },
  { label: 'Incidencias', icon: Wrench, href: () => '/dashboard/maintenance' },
  { label: 'Documentos', icon: FileCode, href: () => '/dashboard/tenant/documents', roles: ['arrendatario'] },
  { label: 'Precios', icon: Tag, href: () => '/precios' },
  { label: 'Status', icon: ShieldCheck, href: () => '/status' },
  { label: 'Configuración', icon: Settings, href: () => '/dashboard/settings' },
];

export default function Sidebar({
  className = '',
  isOpenMobile = false,
  onCloseMobile
}: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = menuItems.filter(item => !item.roles || item.roles.includes(profile?.role || ''));

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  function ThemeToggleButton({ collapsed }: { collapsed: boolean }) {
    const { theme, toggleTheme } = useTheme();
    return (
      <button
        onClick={toggleTheme}
        className={`flex items-center gap-2 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer flex-1 ${collapsed ? 'justify-center' : 'justify-center'}`}
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {theme === 'dark' ? <Sun className="w-3.5 h-3.5 shrink-0" /> : <Moon className="w-3.5 h-3.5 shrink-0" />}
        {!collapsed && <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>}
      </button>
    );
  }

  return (
    <>
      {isOpenMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-45 transition-opacity duration-300 animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-60'
        } bg-card border-r border-border flex flex-col h-screen fixed md:sticky inset-y-0 left-0 z-50 md:z-20 transition-all duration-300 shrink-0 shadow-[1px_0_12px_rgba(0,0,0,0.04)] ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${className}`}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border flex items-center justify-between">
          <Link
            href="/"
            onClick={onCloseMobile}
            className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'}`}
          >
            {collapsed ? (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
                A
              </div>
            ) : (
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Rentnow<span className="text-primary">.</span>
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filtered.map((item) => {
            const href = item.href(profile?.role || '');
            const active = isActive(href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative group ${
                  active
                    ? 'bg-brand text-white shadow-[0_2px_8px_rgba(30,58,95,0.2)]'
                    : 'text-ink-secondary hover:bg-muted hover:text-foreground'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <span className={active ? 'relative' : ''}>
                  <Icon className="w-[18px] h-[18px]" />
                  {active && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
                  )}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border">
          <div className={`flex items-center gap-2.5 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover rounded-full" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name || 'Usuario'}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                  {profile?.role === 'arrendador' ? 'Arrendador' : 'Inquilino'}
                </p>
              </div>
            )}
          </div>

          <div className={`flex gap-2 mt-2 ${collapsed ? 'flex-col' : ''}`}>
            <ThemeToggleButton collapsed={collapsed} />
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                signOut();
              }}
              className={`flex items-center gap-2 py-2 rounded-xl border border-border text-xs font-semibold text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all cursor-pointer flex-1 ${collapsed ? 'justify-center' : 'justify-center'}`}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>Salir</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
