'use client';

import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { User } from '@supabase/supabase-js';
import React,{ createContext,useCallback,useContext,useEffect,useState } from 'react';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string, userMetadata?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' && userMetadata) {
          const displayName = (userMetadata.full_name || userMetadata.name || '') as string;
          const avatar = (userMetadata.avatar_url || userMetadata.picture || '') as string;

          await supabase.from('profiles').upsert({
            id: userId,
            full_name: displayName || null,
            avatar_url: avatar || null,
            role: 'arrendatario',
            preferred_currency: 'USD',
            reminder_days_before: 3,
            timezone: 'America/Bogota',
          }, { onConflict: 'id' });

          const { data: newData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (newData) setProfile(newData as Profile);
        } else {
          console.error('Error fetching profile:', error);
        }
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error('Unexpected error loading profile:', e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initSession = async () => {
      // Limpiar token huérfano (ej. cuando se cambia de proyecto Supabase)
      const stored = localStorage.getItem('supabase.auth.token');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          // Si el token almacenado no coincide con el proyecto actual, limpiarlo
          if (parsed.url && parsed.url !== currentUrl) {
            localStorage.removeItem('supabase.auth.token');
          }
        } catch {
          localStorage.removeItem('supabase.auth.token');
        }
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data?.session?.user) {
          setUser(data.session.user);
          await fetchProfile(data.session.user.id, data.session.user.user_metadata);
        } else if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
          // In DEMO_MODE, also check NextAuth session (for demo@rentnow.app login)
          try {
            const res = await fetch('/api/auth/session');
            const session = await res.json();
            if (session?.user) {
              // Create a mock User object from NextAuth session
              const mockUser = {
                id: session.user.id || 'demo-user-1',
                email: session.user.email || 'demo@rentnow.app',
                user_metadata: { role: 'arrendador', full_name: 'Usuario Demo' },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                app_metadata: {},
              } as unknown as User;
              setUser(mockUser);
              setProfile({
                id: mockUser.id,
                full_name: 'Usuario Demo',
                role: 'arrendador',
                preferred_currency: 'USD',
                reminder_days_before: 3,
                timezone: 'America/Bogota',
              } as Profile);
            }
          } catch (e) {
            console.error('NextAuth session check error:', e);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('supabase.auth.token');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Timeout de seguridad: si getSession no resuelve en 5s, forzar fin del loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        localStorage.removeItem('supabase.auth.token');
      }
    }, 5000);

    initSession().finally(() => clearTimeout(timeoutId));

    const { data: authData } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id, session.user.user_metadata).catch(console.error);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );
    subscription = authData.subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
