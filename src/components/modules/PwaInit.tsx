'use client';

import { registerProductionPWA } from '@/lib/pwa-register';
import { useEffect } from 'react';

/** Módulo 10 — inicializa PWA en el cliente */
export function PwaInit() {
  useEffect(() => {
    registerProductionPWA();
  }, []);
  return null;
}
