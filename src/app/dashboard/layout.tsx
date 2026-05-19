'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Route protection
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Cargando sesión segura...
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Let the useEffect redirect handles it
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Sidebar for Desktop & Mobile */}
      <Sidebar 
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative pb-16 md:pb-0">
        
        {/* Top Header Navbar */}
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Dynamic Nested Sub-page content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>

        {/* Global Dashboard Footer */}
        <footer className="py-6 px-6 md:px-8 border-t border-border bg-card/30 text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 text-xs mt-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center">
              <img src="/logo.svg" alt="RentNow" className="h-5 w-auto dark:hidden" />
              <img src="/logo-light.svg" alt="RentNow" className="h-5 w-auto hidden dark:block" />
            </div>
            <span className="text-[10px] sm:text-xs text-ink-muted">© {new Date().getFullYear()} RentNow. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-4 font-medium text-ink-tertiary">
            <a href="#" className="hover:text-primary transition-colors">Términos de servicio</a>
            <a href="#" className="hover:text-primary transition-colors">Políticas de privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Soporte técnico</a>
          </div>
        </footer>
      </div>

      {/* Navigation for Mobile devices */}
      <BottomNav />
    </div>
  );
}
