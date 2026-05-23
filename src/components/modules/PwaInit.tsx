'use client';

import { registerProductionPWA } from '@/modules/pwa-prod/register-sw';
import { useEffect } from 'react';

/** Módulo 10 — inicializa PWA en el cliente */
export function PwaInit() {
  useEffect(() => {
    registerProductionPWA();
  }, []);
  return null;
}
