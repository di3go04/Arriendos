"use client";

import { useToast } from "@/components/ui/Toast";
import { ConsentBanner } from "@/modules/gdpr";
import { Wizard } from "@/modules/onboarding";
import { ExportButton } from "@/modules/reports";
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Globe,
  Laptop,
  Loader2,
  LogIn,
  LogOut,
  Monitor,
  MousePointerClick,
  Play,
  RefreshCw,
  Rocket,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoProvider, useDemo } from "./DemoContext";
import { PaymentSimulation } from "./components/PaymentSimulation";

const SAMPLE_EVENTS = [
  "Usuario de Madrid inició el Wizard de Onboarding",
  "Pago de $29 USD procesado con éxito (Stripe)",
  "Evento capturado en PostHog: Click en Precios",
  "Contrato firmado digitalmente — Propiedad A",
  "Nuevo inquilino registrado desde Bogotá",
  "Reporte financiero exportado a PDF",
  "Recordatorio de pago enviado a 3 inquilinos",
  "Sesión de usuario desde Chrome 120 — Buenos Aires",
  "Conciliación bancaria completada — Banco Galicia",
  "Notificación push enviada: Pago próximo a vencer",
  "Plantilla de contrato generada con IA",
  "Propiedad nueva publicada: Casa en Palermo",
  "Usuario actualizó su perfil desde la app móvil",
  "Firma electrónica verificada — Documento #8821",
  "Webhook de Stripe recibido: invoice.paid",
];

const SESSION_REPLAYS = [
  { country: "MX", browser: "Chrome 120", duration: "4m 32s", label: "Configuración inicial" },
  { country: "CO", browser: "Safari 17", duration: "2m 15s", label: "Revisión de contratos" },
  { country: "ES", browser: "Chrome 119", duration: "6m 48s", label: "Alta de propiedad" },
  { country: "AR", browser: "Firefox 121", duration: "3m 05s", label: "Exportación de reportes" },
  { country: "CL", browser: "Edge 120", duration: "5m 22s", label: "Configuración de pagos" },
  { country: "PE", browser: "Safari 17", duration: "1m 58s", label: "Visualización de dashboard" },
];

const COUNTRY_FLAGS: Record<string, string> = {
  MX: "🇲🇽", CO: "🇨🇴", ES: "🇪🇸", AR: "🇦🇷", CL: "🇨🇱", PE: "🇵🇪", US: "🇺🇸",
};

const BROWSER_ICONS: Record<string, typeof Laptop> = {
  Chrome: Laptop, Safari: Monitor, Firefox: Laptop, Edge: Monitor,
};

const DATA_7D = { pageEvents: 8350, activeUsers: 1247, conversionRate: 3.6, revenue: 28450 };
const DATA_30D = { pageEvents: 32140, activeUsers: 4102, conversionRate: 4.2, revenue: 108200 };

type LiveEvent = {
  id: number;
  time: string;
  text: string;
};

function DemoContent() {
  const { toast } = useToast();
  const {
    phase, completeOnboarding, resetDemo,
    isDemoAuthenticated, demoUser,
    authenticateSimulation, logoutSimulation,
    selectedPeriod, setSelectedPeriod,
  } = useDemo();

  const periodData = selectedPeriod === "7d" ? DATA_7D : DATA_30D;
  const [events, setEvents] = useState<LiveEvent[]>(() => {
    const now = new Date();
    return SAMPLE_EVENTS.slice(0, 4).map((text, i) => ({
      id: i,
      time: new Date(now.getTime() - (4 - i) * 4000).toTimeString().slice(0, 8),
      text,
    }));
  });
  const [counters, setCounters] = useState({ pageEvents: periodData.pageEvents, activeUsers: periodData.activeUsers, conversionRate: periodData.conversionRate });
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const eventId = useRef(4);

  useEffect(() => {
    setCounters({ pageEvents: periodData.pageEvents, activeUsers: periodData.activeUsers, conversionRate: periodData.conversionRate });
  }, [selectedPeriod]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const randomText = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];
      const newEvent: LiveEvent = { id: eventId.current++, time: now.toTimeString().slice(0, 8), text: randomText };
      setEvents((prev) => [...prev.slice(-19), newEvent]);
      setCounters((prev) => ({
        pageEvents: prev.pageEvents + Math.floor(Math.random() * 8) + 1,
        activeUsers: prev.activeUsers + (Math.random() > 0.6 ? 1 : 0),
        conversionRate: Math.round((prev.conversionRate + (Math.random() - 0.5) * 0.2) * 10) / 10,
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSimulatedSSO = useCallback(async (provider: string) => {
    setSsoLoading(provider);
    await new Promise((r) => setTimeout(r, 1200));
    setSsoLoading(null);
    authenticateSimulation(provider);
    toast({
      type: "success",
      message: `Simulación de token de sesión: activo — ${provider} autenticado correctamente`,
    });
  }, [authenticateSimulation, toast]);

  const sampleData = [
    { id: 1, name: "Propiedad A", price: 1200 },
    { id: 2, name: "Propiedad B", price: 1500 },
  ];

  if (phase === "onboarding") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#1e3a5f] flex items-center justify-center mb-4 shadow-lg shadow-[#1e3a5f]/30">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1E293B] dark:text-white">
              Bienvenido a la Demo Interactiva
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 max-w-md mx-auto">
              Completá el onboarding simulado para desbloquear el dashboard completo con analítica en vivo, pagos simulados y más.
            </p>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm">
            <Wizard onComplete={completeOnboarding} />
          </div>
          <div className="flex items-center justify-center gap-2 mt-6 text-[10px] text-[#94A3B8]">
            <Shield className="w-3 h-3" />
            Datos simulados — sin registro ni almacenamiento real
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1E293B] dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              Panel de control simulado en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Tabs */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              {(["7d", "30d"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === p
                      ? "bg-[#1e3a5f] text-white"
                      : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#0F172A]"
                  }`}
                >
                  {p === "7d" ? "Últimos 7 días" : "Último mes"}
                </button>
              ))}
            </div>

            {/* Auth state */}
            {isDemoAuthenticated && demoUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-600">
                  <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-[10px] font-bold text-white">
                    {demoUser.initials}
                  </div>
                  <span className="text-xs font-semibold text-[#1E293B] dark:text-white hidden sm:inline">
                    {demoUser.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    SSO
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { logoutSimulation(); toast({ type: "info", message: "Sesión simulada cerrada" }); }}
                  className="p-2 rounded-xl text-[#64748B] hover:bg-gray-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                  title="Cerrar sesión simulada"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#1e3a5f] text-white hover:bg-[#152e4a] transition-colors shadow-lg shadow-[#1e3a5f]/20"
              >
                Crear cuenta gratis <Zap className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { icon: Activity, label: "Eventos de página", value: counters.pageEvents.toLocaleString(), color: "text-[#1e3a5f]" },
                { icon: Users, label: "Usuarios activos", value: counters.activeUsers.toLocaleString(), color: "text-[#f59e0b]" },
                { icon: BarChart3, label: "Tasa de conversión", value: `${counters.conversionRate.toFixed(1)}%`, color: "text-emerald-600" },
                { icon: CreditCard, label: "Ingresos (USD)", value: `$${periodData.revenue.toLocaleString()}`, color: "text-[#1e3a5f]" },
              ].map((card) => (
                <div key={card.label} className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                  <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
                  <p className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-0.5">
                    {card.label}
                  </p>
                  <p className="text-xl font-black text-[#1E293B] dark:text-white tabular-nums">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Live Event Feed */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Actividad en vivo</h3>
                <span className="ml-auto text-[10px] text-[#94A3B8] font-mono">{events.length} eventos</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[320px] overflow-y-auto">
                {[...events].reverse().map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-[#0F172A]/50 transition-colors">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[10px] font-mono text-[#94A3B8] shrink-0 mt-0.5">{evt.time}</span>
                    <span className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">{evt.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Replays */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                <Eye className="w-3.5 h-3.5 text-[#1e3a5f]" />
                <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Grabaciones de sesión recientes</h3>
                <span className="ml-auto text-[10px] text-[#94A3B8] font-mono">{SESSION_REPLAYS.length} grabaciones</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {SESSION_REPLAYS.map((session, i) => {
                  const BrowserIcon = BROWSER_ICONS[session.browser.split(" ")[0]] || Globe;
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#0F172A]/50 transition-colors group">
                      <button
                        type="button"
                        onClick={() => toast({ type: "info", message: `Reproduciendo grabación: ${session.label}` })}
                        className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center group-hover:bg-[#1e3a5f]/20 transition-colors cursor-pointer shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 text-[#1e3a5f] ml-0.5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1E293B] dark:text-white truncate">{session.label}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px]">{COUNTRY_FLAGS[session.country] || "🌐"}</span>
                          <BrowserIcon className="w-3 h-3 text-[#94A3B8]" />
                          <span className="text-[10px] text-[#94A3B8]">{session.browser}</span>
                          <Clock className="w-3 h-3 text-[#94A3B8]" />
                          <span className="text-[10px] text-[#94A3B8]">{session.duration}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* SSO */}
            {!isDemoAuthenticated && (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-[#1e3a5f]" />
                  <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Inicio de sesión simulado</h3>
                </div>
                <p className="text-[10px] text-[#94A3B8] mb-4 leading-relaxed">
                  Iniciá sesión con un proveedor simulado para ver cómo se comporta el SSO en producción.
                </p>
                <div className="space-y-3">
                  {[
                    { provider: "google", label: "Continuar con Google" },
                    { provider: "azure-ad", label: "Continuar con Azure AD" },
                  ].map(({ provider, label }) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => handleSimulatedSSO(provider)}
                      disabled={ssoLoading === provider}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#F1F5F9] hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                    >
                      {ssoLoading === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      {ssoLoading === provider ? "Verificando..." : label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Authenticated user info */}
            {isDemoAuthenticated && demoUser && (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Sesión activa</h3>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-sm font-bold text-white">
                    {demoUser.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1E293B] dark:text-white">{demoUser.name}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">SSO · {demoUser.provider}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-3 leading-relaxed">
                  El avatar y nombre ficticio se muestran en el header como si el SSO estuviera activo en producción.
                </p>
              </div>
            )}

            {/* Payment */}
            <PaymentSimulation />

            {/* Export */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MousePointerClick className="w-4 h-4 text-[#1e3a5f]" />
                <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Exportar datos</h3>
              </div>
              <p className="text-[10px] text-[#94A3B8] mb-4 leading-relaxed">
                Generá reportes de ejemplo en PDF o Excel — el spinner y el toast simulan el proceso real.
              </p>
              <div className="flex flex-col gap-2">
                <ExportButton data={sampleData} type="pdf" />
                <ExportButton data={sampleData} type="excel" />
              </div>
            </div>

            {/* GDPR */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#1e3a5f]" />
                <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Consentimiento GDPR</h3>
              </div>
              <ConsentBanner />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reiniciar demo
          </button>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-[#f59e0b] text-[#1e3a5f] hover:bg-[#d97706] transition-colors shadow-lg shadow-[#f59e0b]/30"
          >
            <Zap className="w-4 h-4" />
            Crear cuenta gratis — probá todo en producción
          </Link>
        </div>
        <p className="text-[10px] text-[#94A3B8] text-center">
          Datos simulados con fines demostrativos. Sin registro ni almacenamiento real.
        </p>
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <DemoProvider>
      <DemoContent />
    </DemoProvider>
  );
}
