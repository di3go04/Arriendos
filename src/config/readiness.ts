export type ReadinessArea =
  | 'calidad'
  | 'pagos'
  | 'ventas'
  | 'producto'
  | 'operacion'
  | 'seguridad';

export interface ReadinessItem {
  id: number;
  area: ReadinessArea;
  title: string;
  evidence: string;
  status: 'done' | 'needs_config' | 'manual';
}

export const READINESS_ITEMS: ReadinessItem[] = [
  { id: 1, area: 'calidad', title: 'Lint sin errores bloqueantes', evidence: 'npm run lint', status: 'done' },
  { id: 2, area: 'calidad', title: 'Script de pruebas automatizadas', evidence: 'npm test', status: 'done' },
  { id: 3, area: 'calidad', title: 'Pipeline CI con lint, typecheck, test y build', evidence: '.github/workflows/ci.yml', status: 'done' },
  { id: 4, area: 'ventas', title: 'Guion de video demo', evidence: 'docs/DEMO_SCRIPT.md', status: 'manual' },
  { id: 5, area: 'operacion', title: 'Guia de deploy Vercel + Supabase', evidence: 'docs/DEPLOY_PRODUCCION.md', status: 'manual' },
  { id: 6, area: 'operacion', title: 'Datos demo reproducibles', evidence: 'supabase/seed.demo.sql', status: 'manual' },
  { id: 7, area: 'pagos', title: 'Mercado Pago Checkout API + Checkout Pro', evidence: '/api/payments/process-card + create-preference', status: 'needs_config' },
  { id: 8, area: 'pagos', title: 'Estrategia de pagos unificada en Mercado Pago', evidence: 'SubscribeButton + MercadoPagoCheckout', status: 'done' },
  { id: 9, area: 'producto', title: 'Admin puede revisar suscripciones', evidence: '/api/admin/subscriptions', status: 'done' },
  { id: 10, area: 'seguridad', title: 'Webhooks con firma obligatoria al configurar secreto', evidence: '/api/payments/webhook-mp', status: 'needs_config' },
  { id: 11, area: 'calidad', title: 'Tests de APIs y librerias criticas', evidence: '__tests__', status: 'done' },
  { id: 12, area: 'calidad', title: 'Base para pruebas E2E documentada', evidence: 'docs/QA_CHECKLIST.md', status: 'manual' },
  { id: 13, area: 'calidad', title: 'Typecheck de TypeScript', evidence: 'npm run typecheck', status: 'done' },
  { id: 14, area: 'ventas', title: 'OpenAPI descargable', evidence: 'public/openapi.json', status: 'done' },
  { id: 15, area: 'ventas', title: 'Pricing publico con planes', evidence: '/precios', status: 'done' },
  { id: 16, area: 'producto', title: 'Onboarding inicial', evidence: 'components/onboarding', status: 'done' },
  { id: 17, area: 'producto', title: 'Leads visibles en dashboard', evidence: '/api/dashboard/summary', status: 'done' },
  { id: 18, area: 'producto', title: 'WhatsApp gratis con Baileys (bridge)', evidence: 'npm run whatsapp:bridge + /api/whatsapp/send', status: 'needs_config' },
  { id: 19, area: 'producto', title: 'Documentos legales exportables', evidence: '/api/documents/generate', status: 'done' },
  { id: 20, area: 'producto', title: 'Storage preparado para documentos', evidence: 'Supabase Storage contract-documents', status: 'needs_config' },
  { id: 21, area: 'seguridad', title: 'Roles base y multi-tenant', evidence: 'profiles + organizations', status: 'done' },
  { id: 22, area: 'producto', title: 'White-label por organizacion', evidence: '/api/admin/organizations', status: 'done' },
  { id: 23, area: 'seguridad', title: 'Auditoria operacional', evidence: 'supabase/migrations/06_operational_readiness.sql', status: 'done' },
  { id: 24, area: 'ventas', title: 'SEO y sitemap', evidence: '/sitemap.xml + /robots.txt', status: 'done' },
  { id: 25, area: 'ventas', title: 'Captura de leads desde portal publico', evidence: '/api/leads', status: 'done' },
  { id: 26, area: 'ventas', title: 'Landing y demo publico', evidence: '/ + /demo', status: 'done' },
  { id: 27, area: 'operacion', title: 'Exportacion backup en JSON', evidence: '/api/admin/export', status: 'done' },
  { id: 28, area: 'producto', title: 'Tickets de soporte para inquilinos', evidence: '/api/tenant/tickets', status: 'done' },
  { id: 29, area: 'operacion', title: 'Metricas de negocio y salud', evidence: '/api/health + /status', status: 'done' },
  { id: 30, area: 'ventas', title: 'Checklist de venta actualizada', evidence: '/admin/readiness', status: 'done' },
  { id: 31, area: 'ventas', title: 'DEMO_MODE activo con credenciales demo', evidence: 'DEMO_MODE=true + src/lib/demo.ts', status: 'manual' },
  { id: 32, area: 'ventas', title: 'Datos demo reproducibles via seed script', evidence: 'scripts/seed-demo-data.js', status: 'manual' },
  { id: 33, area: 'ventas', title: 'Documentacion DEMO_MODE.md completa', evidence: 'DEMO_MODE.md', status: 'manual' },
  { id: 34, area: 'ventas', title: 'API /api/demo/status operativa', evidence: 'GET /api/demo/status', status: 'done' },
  { id: 35, area: 'producto', title: 'Pool de descripciones IA simuladas', evidence: 'src/lib/demo.ts → MOCK_DESCRIPTIONS', status: 'done' },
];
