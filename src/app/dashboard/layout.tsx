'use client';

import BackToHome from '@/components/shared/BackToHome';
import BottomNav from '@/components/shared/BottomNav';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React,{ useEffect,useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-primary flex items-center justify-center mb-4 shadow-lg">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Cargando sesión segura...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen relative pb-16 md:pb-0">
        <div className="flex items-center gap-3 px-6 pt-6 md:px-8 md:pt-8">
          <BackToHome />
        </div>
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>

        <footer className="py-5 px-6 md:px-8 border-t border-border text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Rentnow<span className="text-[#f59e0b]">.</span>
            </span>
            <span className="text-[10px]">© {new Date().getFullYear()} Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <a href="#" className="hover:text-primary transition-colors">Términos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Soporte</a>
          </div>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
}
