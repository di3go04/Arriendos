'use client';

import { ArrowLeft, Building2, Mail, Shield } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function PrivacidadPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <a href={`/${locale}`} className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1e3a5f] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('actions.back_home')}
        </a>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1e3a5f] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] dark:text-white">Aviso de Privacidad</h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Última actualización: Julio 2026</p>
          </div>
        </div>
        <div className="space-y-8">
          <Section title="1. Responsable del Tratamiento">
            <p><strong>RentNow S.A.S.</strong> es el responsable del tratamiento de sus datos personales.</p>
            <div className="flex items-center gap-2 text-sm text-[#64748B] mt-2"><Mail className="w-4 h-4" /> privacidad@rentnow.app</div>
          </Section>
          <Section title="2. Datos que Recolectamos">
            <ul><li>Nombre completo, correo electrónico, teléfono</li><li>Rol (arrendador / arrendatario)</li><li>Dirección, tipo y características de propiedades</li><li>Métodos de pago (procesados por Stripe y Mercado Pago)</li></ul>
          </Section>
          <Section title="3. Finalidades">
            <ul><li>Prestar el servicio de gestión de arrendamientos</li><li>Procesar pagos y suscripciones</li><li>Generar contratos y documentos legales</li><li>Enviar notificaciones y recordatorios</li></ul>
          </Section>
          <Section title="4. Derechos del Titular">
            <p>Puede ejercer sus derechos ARCO escribiendo a <strong>privacidad@rentnow.app</strong>. Respondemos en 15 días hábiles.</p>
          </Section>
          <Section title="5. Contacto">
            <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-[#1e3a5f]" /><div><p className="font-semibold text-[#1E293B] dark:text-white">Delegado de Protección de Datos</p><p className="text-sm text-[#64748B]">privacidad@rentnow.app</p></div></div>
            <div className="flex items-center gap-3 mt-3"><Building2 className="w-5 h-5 text-[#1e3a5f]" /><div><p className="font-semibold text-[#1E293B] dark:text-white">RentNow S.A.S.</p><p className="text-sm text-[#64748B]">Bogotá D.C., Colombia</p></div></div>
          </Section>
        </div>
        <div className="mt-12 pt-8 border-t border-[#E2E8F0] dark:border-[#334155] text-center">
          <p className="text-sm text-[#94A3B8]">&copy; {new Date().getFullYear()} RentNow S.A.S. Todos los derechos reservados.</p>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<section><h2 className="text-xl font-bold text-[#1E293B] dark:text-white mb-4">{title}</h2><div className="text-[#475569] dark:text-[#CBD5E1] leading-relaxed space-y-3">{children}</div></section>);
}
