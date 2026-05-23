'use client';

import BackToHome from '@/components/shared/BackToHome';
import Navbar from '@/components/shared/Navbar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Building2,FileText,Loader2,Shield,Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect,useState } from 'react';

interface ProfileItem {
  id: string;
  full_name: string;
  phone: string;
  role: 'arrendador' | 'arrendatario' | 'admin';
  created_at: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [contractsCount, setContractsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all profiles
        const { data: profsData, error: profsErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profsErr) throw profsErr;
        setProfiles(profsData || []);

        // 2. Fetch properties count
        const { count: propsCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });
        
        setPropertiesCount(propsCount || 0);

        // 3. Fetch contracts count
        const { count: contsCount } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true });

        setContractsCount(contsCount || 0);

      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Iniciando Consola de Administrador...</p>
      </div>
    );
  }

  // Count per role
  const landlordsCount = profiles.filter(p => p.role === 'arrendador').length;
  const tenantsCount = profiles.filter(p => p.role === 'arrendatario').length;
  const adminsCount = profiles.filter(p => p.role === 'admin').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <BackToHome />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full animate-fade-in">
        
        {/* Admin Header banner */}
        <div className="bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent border border-red-500/15 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Consola de Control del Administrador</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Monitorea a los usuarios registrados, perfiles del sistema y la salud operativa general de RentNow.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/configuracion"
          className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10"
        >
          <Shield className="w-4 h-4" />
          Configuración Stripe (base de datos)
        </Link>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary w-fit mb-4">
              <Users className="w-5 h-5" />
            </div>
            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Usuarios</span>
            <span className="block text-3xl font-extrabold text-foreground mt-1">{profiles.length}</span>
            <span className="block text-[10px] text-muted-foreground mt-2 font-medium">
              {landlordsCount} arrendadores y {tenantsCount} inquilinos
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 w-fit mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Propiedades</span>
            <span className="block text-3xl font-extrabold text-foreground mt-1">{propertiesCount}</span>
            <span className="block text-[10px] text-muted-foreground mt-2 font-medium">Inmuebles listados en total</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 w-fit mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Contratos Totales</span>
            <span className="block text-3xl font-extrabold text-foreground mt-1">{contractsCount}</span>
            <span className="block text-[10px] text-muted-foreground mt-2 font-medium">Emitidos en la plataforma</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 w-fit mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Administradores</span>
            <span className="block text-3xl font-extrabold text-foreground mt-1">{adminsCount}</span>
            <span className="block text-[10px] text-muted-foreground mt-2 font-medium">Cuentas con acceso de control</span>
          </div>
        </div>

        {/* User Profiles Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-border p-6">
            <h3 className="text-base font-bold text-foreground">Registro de Cuentas Activas</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Todos los perfiles registrados en la base de datos de RentNow</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider pl-6">Nombre Completo</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">ID de Usuario</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Teléfono</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rol de Sistema</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider pl-6">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors text-xs">
                    <td className="p-4 font-bold text-foreground pl-6 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                        {p.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span>{p.full_name}</span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-[10px] select-all">{p.id}</td>
                    <td className="p-4 font-medium text-foreground">{p.phone || 'No registrado'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.role === 'admin'
                          ? 'bg-red-500/10 border-red-500/20 text-red-500'
                          : p.role === 'arrendador'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        {p.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground pl-6">
                      {new Date(p.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
