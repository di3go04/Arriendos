'use client';

import PremiumImprovementsPanel from '@/components/admin/PremiumImprovementsPanel';
import ValuationCalculator from '@/components/admin/ValuationCalculator';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MejorasModularesPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-5 py-10 space-y-8">
        <Link href="/admin/readiness" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
          <ArrowLeft className="w-4 h-4" />
          Volver al checklist
        </Link>

        <section>
          <p className="text-xs font-black uppercase tracking-widest text-primary">Valoración modular</p>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2">9 mejoras premium</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Cada mejora es un módulo independiente en <code className="text-xs">src/modules/</code>. Aquí ves cuánto
            añade al precio de venta (USD), cuánto cuesta implementarla y el total consolidado.
          </p>
        </section>

        <PremiumImprovementsPanel />

        <section>
          <h2 className="text-lg font-black text-foreground mb-4">Simulador SaaS (ARR + checklist)</h2>
          <ValuationCalculator initialScore={90} />
        </section>
      </main>
    </div>
  );
}
