"use client";

import { PostHogDashboard } from "@/modules/analytics";
import { ConsentBanner } from "@/modules/gdpr";
import { Wizard } from "@/modules/onboarding";
import { ExportButton } from "@/modules/reports";
import { SSOLoginButton } from "@/modules/sso";
import Link from "next/link";

const sampleData = [
  { id: 1, name: "Propiedad A", price: 1200 },
  { id: 2, name: "Propiedad B", price: 1500 },
];

export default function LocaleDemoPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Demo de mejoras implementadas</h1>

      {/* 1. SSO */}
      <section>
        <h2 className="text-xl font-semibold mb-2">1️⃣ Autenticación SSO</h2>
        <SSOLoginButton provider="google" />
        <SSOLoginButton provider="azure-ad" />
      </section>

      {/* 2. GDPR */}
      <section>
        <h2 className="text-xl font-semibold mb-2">2️⃣ Banner de consentimiento GDPR</h2>
        <ConsentBanner />
      </section>

      {/* 3. Analítica */}
      <section>
        <h2 className="text-xl font-semibold mb-2">3️⃣ Panel de analítica PostHog</h2>
        <PostHogDashboard />
      </section>

      {/* 4. Onboarding */}
      <section>
        <h2 className="text-xl font-semibold mb-2">4️⃣ Wizard de onboarding</h2>
        <Wizard />
      </section>

      {/* 5. Exportación de reportes */}
      <section>
        <h2 className="text-xl font-semibold mb-2">5️⃣ Exportar datos</h2>
        <ExportButton data={sampleData} type="pdf" />
        <ExportButton data={sampleData} type="excel" />
      </section>

      {/* Enlaces a rutas de prueba para los demás módulos */}
      <section>
        <h2 className="text-xl font-semibold mb-2">6️⃣ Rutas de prueba</h2>
        <ul className="list-disc pl-5">
          <li>
            <Link href="/api/billing/webhook">Webhook de facturación (Stripe)</Link>
          </li>
          <li>
            <Link href="/api/edge/test.json">Edge cache demo</Link>
          </li>
          <li>
            <Link href="/api/properties">Endpoint protegido por RBAC (usa cookie role)</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
