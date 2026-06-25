import { ArrowRight, Check, ChevronRight, FileText, Shield, Users, Zap } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: Users, title: 'Multi-tenant completo', desc: 'Soporte para agencias, roles y white-label' },
  { icon: Zap, title: 'IA predictiva', desc: 'Gemini para contratos y predicción de morosidad' },
  { icon: Shield, title: '3 pasarelas de pago', desc: 'Mercado Pago, Stripe y PayPal integrados' },
  { icon: FileText, title: 'Firma electrónica', desc: 'Contratos con validez legal y PDF' },
];

export default function ComprarCodigoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e3a5f] text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-400">Código fuente completo</p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Adquiere <span className="text-amber-400">RentNow</span>
            <br />SaaS de arrendamientos
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Plataforma lista para desplegar con 33 módulos funcionales, 6 idiomas, pagos, IA y PWA. 
            Ideal para PropTech, fintech inmobiliaria o agencias de arrendamiento.
          </p>
        </div>

        {/* Demo CTA */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-black">¿Quieres verlo en acción?</h2>
          <p className="text-white/70 max-w-xl mx-auto">
            Usa estas credenciales para explorar el dashboard completo:
          </p>
          <div className="inline-flex flex-col gap-3 bg-white/10 rounded-2xl p-6 text-left font-mono text-sm">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-black text-xs uppercase w-20">Demo:</span>
              <span className="bg-white/10 px-3 py-1.5 rounded-lg text-amber-300">demo@rentnow.app</span>
              <span className="text-white/40">/</span>
              <span className="bg-white/10 px-3 py-1.5 rounded-lg text-amber-300">demo</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-black text-xs uppercase w-20">Landlord:</span>
              <span className="bg-white/10 px-3 py-1.5 rounded-lg">arrendador@rentnow.app</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login-direct"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-400 text-[#0f172a] font-black text-sm hover:bg-amber-300 transition-all hover:scale-105 shadow-lg shadow-amber-400/30"
            >
              Ir al login <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/30 font-bold text-sm hover:bg-white/10 transition-all"
            >
              Demo interactiva <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-3">
              <f.icon className="w-6 h-6 text-amber-400" />
              <h3 className="font-bold">{f.title}</h3>
              <p className="text-sm text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stack */}
        <div className="bg-white/5 rounded-3xl border border-white/10 p-8 md:p-12">
          <h2 className="text-2xl font-black mb-8 text-center">Stack técnico incluido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Frontend', value: 'Next.js 16 + React 19' },
              { label: 'Estilos', value: 'Tailwind v4 + shadcn/ui' },
              { label: 'Base de datos', value: 'Supabase (PostgreSQL)' },
              { label: 'Autenticación', value: 'Supabase Auth + NextAuth' },
              { label: 'Pagos', value: 'MP + Stripe + PayPal' },
              { label: 'IA', value: 'Google Gemini' },
              { label: 'Idiomas', value: '6 idiomas (next-intl)' },
              { label: 'Infra', value: 'Vercel / Docker' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="font-bold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What you get */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-center">33 módulos incluidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Auth empresarial (login, lockout, sesiones)',
              'Mercado Pago Checkout API',
              'Stripe payments + webhooks',
              'PayPal suscripciones',
              'Multi-tenant con white-label',
              'Firma electrónica (hash, validez legal)',
              'Contratos con IA (Gemini)',
              'Predicción de morosidad',
              'PWA offline-first + push notifications',
              'WhatsApp Baileys (recordatorios)',
              'OpenAPI / Swagger docs',
              'GDPR consent banner',
              'Portal público de propiedades + leads',
              'Dashboard con gráficos Recharts',
              'Reportes PDF/CSV/Excel',
              'Onboarding guiado en 5 pasos',
              'Modo oscuro / claro',
              'SEO (sitemap, robots, Schema.org)',
              'Docker Compose listo',
              '20+ API REST endpoints',
            ].map((mod) => (
              <div key={mod} className="flex items-center gap-3 text-sm text-white/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                {mod}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-6 pt-8 border-t border-white/10">
          <a
            href="mailto:ventas@rentnow.app?subject=Quiero%20comprar%20RentNow"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-amber-400 text-[#0f172a] font-black text-lg hover:bg-amber-300 transition-all hover:scale-105 shadow-lg shadow-amber-400/30"
          >
            Solicitar precio y soporte 30d <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-white/40 text-sm">Incluye: código fuente completo + 30 días de soporte + video demo + documentación</p>
        </div>
      </div>
    </main>
  );
}
