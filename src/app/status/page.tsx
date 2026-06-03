'use client';

import { motion,useReducedMotion } from 'framer-motion';
import { AlertTriangle,CheckCircle,Database,Loader2,RefreshCw,Server,Wifi } from 'lucide-react';
import { useEffect,useState } from 'react';

interface ServiceCheck {
  status: string;
  latency?: number;
  error?: string;
}

interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  latency: number;
  services: Record<string, ServiceCheck>;
}

const serviceMeta: Record<string, { label: string; icon: React.ElementType }> = {
  database: { label: 'Base de Datos', icon: Database },
  email: { label: 'Email', icon: Server },
  payments: { label: 'Pagos', icon: Wifi },
  whatsapp: { label: 'WhatsApp', icon: Server },
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    operational: { label: 'Operativo', color: 'text-success bg-success/10 border-success/20' },
    degraded: { label: 'Degradado', color: 'text-warning bg-warning/10 border-warning/20' },
    not_configured: { label: 'No configurado', color: 'text-muted-foreground bg-muted border-border' },
  };
  const c = config[status] || config.not_configured;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${c.color}`}>
      {status === 'operational' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Failed to fetch health');
      setData(await res.json());
    } catch {
      setError('No se pudo conectar con el servicio de salud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealth(); }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F172A]">
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-16">
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Estado del Sistema
          </h1>
          <p className="text-muted-foreground text-sm">RentNow · Monitoreo en tiempo real</p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-card bg-destructive/10 border border-destructive/20 p-6 text-center mb-8"
          >
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm font-bold text-destructive">{error}</p>
            <button onClick={fetchHealth} className="mt-3 text-xs font-semibold text-primary hover:underline cursor-pointer bg-transparent border-none">
              Reintentar
            </button>
          </motion.div>
        )}

        {data && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`shadow-card rounded-card p-6 mb-8 text-center border ${
                data.status === 'operational' ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'
              }`}
            >
              <p className={`text-lg font-bold ${data.status === 'operational' ? 'text-success' : 'text-warning'}`}>
                {data.status === 'operational' ? '✓ Todos los sistemas operativos' : '⚠ Algunos servicios requieren atención'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Latencia: {data.latency}ms · Uptime: {Math.round(data.uptime / 60)}min
              </p>
            </motion.div>

            <div className="shadow-card rounded-card overflow-hidden border border-border">
              {Object.entries(data.services).map(([key, svc], i) => {
                const meta = serviceMeta[key] || { label: key, icon: Server };
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={key}
                    initial={reduce ? { opacity: 1 } : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduce ? 0 : 0.3 + i * 0.08 }}
                    className={`flex items-center justify-between p-5 ${
                      i < Object.keys(data.services).length - 1 ? 'border-b border-border' : ''
                    } hover:bg-muted/30 transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                        {svc.latency !== undefined && svc.latency > 0 && (
                          <p className="text-xs text-muted-foreground">{svc.latency}ms</p>
                        )}
                        {svc.error && (
                          <p className="text-xs text-warning">{svc.error}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={svc.status} />
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 text-center flex items-center justify-center gap-4">
              <p className="text-xs text-muted-foreground">
                Última actualización: {new Date(data.timestamp).toLocaleString('es-CO')}
              </p>
              <button
                onClick={fetchHealth}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer bg-transparent border-none"
              >
                <RefreshCw className="w-3 h-3" /> Actualizar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
