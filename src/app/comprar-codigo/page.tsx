import Link from 'next/link';

/** Módulo 20 — landing comercial reventa del código */
export default function ComprarCodigoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e3a5f] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-400">Licencia de código fuente</p>
        <h1 className="text-4xl md:text-5xl font-black">Adquiere RentNow — SaaS de arrendamientos</h1>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          20 módulos listos: auth empresarial, Mercado Pago Checkout API, multi-tenant, E2E, OpenAPI,
          PWA, firma electrónica, IA de contratos, WhatsApp Baileys y más.
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-white/90">
          <li>✓ Código Next.js 16 + Supabase</li>
          <li>✓ 30 días de soporte por email incluidos</li>
          <li>✓ Video demo + documentación de arquitectura</li>
          <li>✓ Despliegue Docker Compose documentado</li>
        </ul>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/demo"
            className="px-8 py-4 rounded-2xl bg-amber-400 text-[#0f172a] font-black text-sm"
          >
            Ver demo en vivo
          </Link>
          <a
            href="mailto:ventas@rentnow.app?subject=Compra%20codigo%20RentNow"
            className="px-8 py-4 rounded-2xl border border-white/30 font-bold text-sm"
          >
            Solicitar precio y soporte 30d
          </a>
        </div>
      </div>
    </main>
  );
}
