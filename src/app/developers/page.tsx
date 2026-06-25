import { ArrowRight,BookOpen,Code,Globe,Lock,Shield,Zap } from 'lucide-react';

const moduleApis = [
  { path: '/api/modules/auth-enterprise/login', desc: 'Lockout + sesiones' },
  { path: '/api/modules/subscriptions-saas/trial', desc: 'Trial SaaS' },
  { path: '/api/modules/e-signature/sign', desc: 'Firma legal + hash' },
  { path: '/api/modules/ai-contracts/generate', desc: 'Contrato IA' },
  { path: '/api/modules/whatsapp-automation/enqueue', desc: 'Cola WhatsApp' },
];
import Link from 'next/link';

const sections = [
  {
    title: 'Autenticación',
    description: 'API segura con tokens JWT. Todas las rutas requieren autenticación mediante Supabase Auth.',
    methods: [
      { method: 'POST', path: '/api/auth/register', description: 'Registro de nuevo usuario' },
      { method: 'POST', path: '/api/auth/login', description: 'Inicio de sesión' },
      { method: 'POST', path: '/api/auth/logout', description: 'Cierre de sesión' },
    ],
  },
  {
    title: 'Propiedades',
    description: 'Gestión completa de propiedades en alquiler.',
    methods: [
      { method: 'GET', path: '/api/properties', description: 'Listar propiedades del usuario' },
      { method: 'GET', path: '/api/properties/public', description: 'Listar propiedades disponibles (público)' },
      { method: 'POST', path: '/api/properties', description: 'Crear nueva propiedad' },
      { method: 'PUT', path: '/api/properties/[id]', description: 'Actualizar propiedad' },
      { method: 'DELETE', path: '/api/properties/[id]', description: 'Eliminar propiedad' },
    ],
  },
  {
    title: 'Contratos',
    description: 'Generación y gestión de contratos de arrendamiento.',
    methods: [
      { method: 'GET', path: '/api/contracts', description: 'Listar contratos' },
      { method: 'POST', path: '/api/contracts', description: 'Crear contrato' },
      { method: 'PUT', path: '/api/contracts/[id]/sign', description: 'Firmar contrato' },
      { method: 'POST', path: '/api/contracts/generate-pdf', description: 'Generar PDF de contrato' },
    ],
  },
  {
    title: 'Pagos',
    description: 'Procesamiento de pagos con Stripe integrado.',
    methods: [
      { method: 'GET', path: '/api/payments', description: 'Listar pagos' },
      { method: 'POST', path: '/api/payments/intent', description: 'Crear intención de pago' },
      { method: 'POST', path: '/api/payments/webhook', description: 'Webhook de Stripe' },
      { method: 'GET', path: '/api/payments/stats', description: 'Estadísticas de pagos' },
    ],
  },
  {
    title: 'Suscripciones',
    description: 'Gestión de planes y suscripciones.',
    methods: [
      { method: 'POST', path: '/api/subscriptions/create', description: 'Crear suscripción' },
      { method: 'GET', path: '/api/subscriptions/status', description: 'Estado de suscripción' },
      { method: 'POST', path: '/api/subscriptions/webhook', description: 'Webhook de suscripciones' },
      { method: 'DELETE', path: '/api/subscriptions/cancel', description: 'Cancelar suscripción' },
    ],
  },
  {
    title: 'IA y Análisis',
    description: 'Servicios de inteligencia artificial para predicción y análisis.',
    methods: [
      { method: 'POST', path: '/api/ai/predict-morosity', description: 'Predecir riesgo de morosidad' },
      { method: 'POST', path: '/api/ai/generate-template', description: 'Generar plantilla con IA' },
      { method: 'GET', path: '/api/ai/market-analysis', description: 'Análisis de mercado' },
    ],
  },
  {
    title: 'Documentos',
    description: 'Generación de documentos legales y fiscales.',
    methods: [
      { method: 'POST', path: '/api/documents/generate', description: 'Generar recibo, certificado, paz y salvo' },
      { method: 'GET', path: '/api/documents/list', description: 'Listar documentos generados' },
    ],
  },
  {
    title: 'Reportes',
    description: 'Reportes financieros avanzados.',
    methods: [
      { method: 'GET', path: '/api/reports/financial', description: 'Reporte financiero anual' },
      { method: 'GET', path: '/api/reports/export', description: 'Exportar reporte (PDF/CSV/Excel)' },
    ],
  },
  {
    title: 'Notificaciones',
    description: 'Notificaciones push y en tiempo real.',
    methods: [
      { method: 'POST', path: '/api/notifications/send', description: 'Enviar notificación' },
      { method: 'POST', path: '/api/notifications/push', description: 'Registrar suscripción push' },
      { method: 'GET', path: '/api/notifications', description: 'Obtener notificaciones' },
    ],
  },
  {
    title: 'Leads',
    description: 'Gestión de leads desde el portal público.',
    methods: [
      { method: 'POST', path: '/api/leads', description: 'Registrar lead desde portal' },
      { method: 'GET', path: '/api/leads', description: 'Obtener leads del arrendador' },
    ],
  },
  {
    title: 'Servicios / Marketplace',
    description: 'Directorio de proveedores de servicios.',
    methods: [
      { method: 'GET', path: '/api/services', description: 'Listar proveedores' },
      { method: 'POST', path: '/api/services', description: 'Solicitar servicio' },
    ],
  },
];

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-[#f59e0b]" />
            <span className="text-sm font-bold text-[#f59e0b] uppercase tracking-wider">API Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
            API de RentNow
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mb-8">
            Integra la gestión de arriendos en tus propias aplicaciones. Nuestra API REST te permite automatizar propiedades, contratos, pagos y más.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-[#f59e0b]" /> REST API
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#4d7c0f]" /> Auth Required
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-blue-400" /> HTTPS Only
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-[#f59e0b]" /> CORS Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 -mt-8">
        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-card">
          <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Inicio Rápido
          </h2>
          <div className="bg-[#0f172a] rounded-2xl p-4 md:p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-[#4d7c0f] leading-relaxed">
{'// Obtener API Key desde el dashboard\nconst API_KEY = \'tu-api-key\';\nconst BASE_URL = \'https://rentnow.app/api\';\n\n// Ejemplo: Listar propiedades\nconst response = await fetch(BASE_URL + \'/properties\', {\n  headers: { \'Authorization\': `Bearer ${API_KEY}` }\n});\nconst properties = await response.json();'}
            </pre>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-card">
            <h3 className="text-lg font-black text-foreground mb-2">{section.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{section.description}</p>
            <div className="space-y-2">
              {section.methods.map((endpoint) => (
                <div key={`${endpoint.method}-${endpoint.path}`} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl text-sm hover:bg-muted/50 transition-colors">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    endpoint.method === 'GET' ? 'bg-success/15 text-success' :
                    endpoint.method === 'POST' ? 'bg-primary/15 text-primary' :
                    endpoint.method === 'PUT' ? 'bg-warning/15 text-warning' :
                    'bg-destructive/15 text-destructive'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-xs font-mono text-foreground/80">{endpoint.path}</code>
                  <span className="text-xs text-muted-foreground ml-auto">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Módulos API */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-8">
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card">
          <h3 className="font-black text-foreground text-lg mb-4">APIs modulares (20 módulos)</h3>
          <div className="space-y-2">
            {moduleApis.map((m) => (
              <div key={m.path} className="flex gap-3 text-sm font-mono border-b border-border/30 py-2">
                <code className="text-primary">{m.path}</code>
                <span className="text-muted-foreground">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OpenAPI Spec */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-8">
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card">
          <h3 className="font-black text-foreground text-lg mb-2">OpenAPI / Swagger</h3>
          <p className="text-sm text-muted-foreground mb-6">Especificación OpenAPI 3.0 + UI interactiva.</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/developers/swagger"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary"
            >
              Swagger UI <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="/openapi.json" download className="text-sm font-bold underline">
              openapi.json
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-16 text-center">
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card">
          <h3 className="font-black text-foreground text-lg mb-2">¿Necesitas más?</h3>
          <p className="text-sm text-muted-foreground mb-6">Contamos con webhooks para eventos en tiempo real y SDK próximamente.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
            Contactar para API Enterprise <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
