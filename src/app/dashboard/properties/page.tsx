'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardPropertiesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/properties');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-xs font-semibold text-muted-foreground">Redirigiendo a gestión de propiedades...</p>
    </div>
  );
}
