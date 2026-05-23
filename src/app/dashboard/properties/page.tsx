'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPropertiesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/properties');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center animate-pulse">
        <span className="text-white font-bold text-xs">A</span>
      </div>
      <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
      <p className="text-xs font-semibold text-[#94A3B8]">Redirigiendo a gestión de propiedades...</p>
    </div>
  );
}
