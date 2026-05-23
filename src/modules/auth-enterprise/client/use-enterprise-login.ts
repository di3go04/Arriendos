'use client';

import { supabase } from '@/lib/supabase';
import { getOrCreateDeviceFingerprint } from './device-fingerprint';

async function authApi(action: string, body: Record<string, unknown>) {
  try {
    const res = await fetch('/api/modules/auth-enterprise/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body, fingerprint: getOrCreateDeviceFingerprint() }),
    });
    return res.json();
  } catch {
    return { error: { message: 'Error de conexión con el servidor de autenticación.' } };
  }
}

export function useEnterpriseLogin() {
  const checkAllowed = async (email: string) => {
    try {
      const result = await authApi('check', { email });
      return result;
    } catch {
      return { error: { message: 'Error de conexión con el servidor. Verifica tu conexión a internet.' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const check = await checkAllowed(email);
      if (check.error) {
        return check;
      }
      if (check.data && check.data.allowed === false) {
        return { error: { message: check.data.message || 'Cuenta bloqueada temporalmente' } };
      }
    } catch {
      return { error: { message: 'Error de conexión con el servidor. Verifica tu conexión a internet.' } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        await authApi('failure', { email });
        return { error };
      }

      if (data.user) {
        await authApi('success', { email, userId: data.user.id });
      }

      return { data, error: null };
    } catch {
      return {
        error: {
          message:
            'Error de conexión con el servidor. Verifica tus variables de entorno o red.',
        },
      };
    }
  };

  const requestReset = async (email: string) => {
    try {
      const res = await fetch('/api/modules/auth-enterprise/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.json();
    } catch {
      return { error: { message: 'Error de conexión con el servidor. Intenta de nuevo.' } };
    }
  };

  return { checkAllowed, signIn, requestReset };
}
