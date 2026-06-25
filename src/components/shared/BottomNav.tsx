'use client';

import { useAuth } from '@/context/AuthContext';
import {
Building2,DollarSign,
FileCode,
FileText,
LayoutDashboard,
LogOut,
Menu,
Settings,
Tag,
User as UserIcon,
Users,
Wrench,
X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function BottomNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations('bottom_nav');

  const isLandlord = profile?.role === 'arrendador';

  const mainTabs = isLandlord
    ? [
        { name: t('dashboard'), href: '/app/landlord', icon: LayoutDashboard },
        { name: t('properties'), href: '/properties', icon: Building2 },
        { name: t('collections'), href: '/app/payments', icon: DollarSign },
      ]
    : [
        { name: t('dashboard'), href: '/app/tenant', icon: LayoutDashboard },
        { name: t('my_contract'), href: '/app/leases', icon: FileText },
        { name: t('my_payments'), href: '/app/payments', icon: DollarSign },
      ];

  const moreTabs = isLandlord
    ? [
        { name: t('tenants'), href: '/app/tenants', icon: Users },
        { name: t('templates'), href: '/templates', icon: FileCode },
        { name: t('contracts'), href: '/app/leases', icon: FileText },
        { name: t('incidents'), href: '/app/maintenance', icon: Wrench },
        { name: t('pricing'), href: '/precios', icon: Tag },
        { name: t('settings'), href: '/app/settings', icon: Settings },
      ]
    : [
        { name: t('report_damage'), href: '/app/maintenance', icon: Wrench },
        { name: t('pricing'), href: '/precios', icon: Tag },
        { name: t('settings'), href: '/app/settings', icon: Settings },
      ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex items-center justify-around px-2">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link key={tab.name} href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
                isActive ? 'text-primary' : 'text-ink-muted'
              }`}>
              {isActive && <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-b" />}
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-semibold">{tab.name}</span>
            </Link>
          );
        })}

        <button onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative outline-none cursor-pointer ${
            isMenuOpen ? 'text-primary' : 'text-ink-muted'
          }`}>
          {isMenuOpen && <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-b" />}
          {isMenuOpen ? <X className="w-5 h-5 mb-0.5" /> : <Menu className="w-5 h-5 mb-0.5" />}
          <span className="text-[9px] font-semibold">{t('more')}</span>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-end animate-fade-in" onClick={() => setIsMenuOpen(false)}>
          <div className="w-full bg-card rounded-t-2xl border-t border-border p-5 space-y-5 pb-24 max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto -mt-1 mb-3" />

            <div className="flex items-center gap-3 p-2 border-b border-border pb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden text-sm font-bold">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || t('user_fallback')} className="w-full h-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="block text-sm font-semibold text-foreground">
                  {profile?.full_name || t('user_fallback')}
                </span>
                <span className="block text-[10px] text-ink-muted uppercase tracking-wider font-medium">
                  {isLandlord ? t('landlord_role') : t('tenant_role')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link key={tab.name} href={tab.href} onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted border-border text-ink-tertiary hover:text-foreground'
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </Link>
                );
              })}
            </div>

            <button onClick={() => { setIsMenuOpen(false); signOut(); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
