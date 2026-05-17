'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/shared/BottomNav';
import { Loader2 } from 'lucide-react';

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

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
          Cargando propiedades...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar for Desktop */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative pb-16 md:pb-0">
        {/* Top Header Navbar */}
        <Navbar />

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
