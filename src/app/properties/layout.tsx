'use client';

import BottomNav from '@/components/shared/BottomNav';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React,{ useEffect,useState } from 'react';

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('loading');

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
          {t('properties')}
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
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
      </div>

      {/* Navigation for Mobile devices */}
      <BottomNav />
    </div>
  );
}
