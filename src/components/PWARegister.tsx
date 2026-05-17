'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const unregisterAll = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
          console.log('SW unregistered:', reg.scope);
        }
      };
      unregisterAll();
    }
  }, []);

  return null;
}
