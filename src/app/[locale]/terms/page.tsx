'use client';

import { ArrowLeft, Building2, FileText, Mail } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function TermsPage() {
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
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] dark:text-white">Terms of Service</h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Last updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>By accessing and using the RentNow platform, you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </Section>

          <Section title="2. Definitions">
            <ul>
              <li><strong>Platform:</strong> The RentNow web application accessible at rentnow.app</li>
              <li><strong>User:</strong> Any individual or legal entity registered on the Platform</li>
              <li><strong>Landlord:</strong> A user who lists properties for rent</li>
              <li><strong>Tenant:</strong> A user who searches for and rents properties</li>
            </ul>
          </Section>

          <Section title="3. Registration and Account">
            <ul>
              <li>You must provide accurate and up-to-date information</li>
              <li>You are responsible for maintaining credential confidentiality</li>
              <li>RentNow reserves the right to suspend accounts that violate these terms</li>
            </ul>
          </Section>

          <Section title="4. Plans and Subscriptions">
            <ul>
              <li><strong>Basic (free):</strong> Up to 2 properties and 2 tenants</li>
              <li><strong>Professional ($12 USD/mo):</strong> Up to 10 properties, unlimited tenants, AI, digital signature, API</li>
              <li><strong>Business ($24 USD/mo):</strong> Unlimited properties, multi-user, white label, 24/7 support</li>
            </ul>
            <p className="mt-3">Payments are processed via Stripe or Mercado Pago. Subscriptions auto-renew monthly. Cancel anytime from your settings panel.</p>
          </Section>

          <Section title="5. Electronic Signature">
            <p>Contracts signed electronically through the Platform have full legal validity under applicable laws, including Colombia&apos;s Law 527 of 1999 and EU eIDAS regulation.</p>
          </Section>

          <Section title="6. Contact">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">RentNow S.A.S.</p>
                <p className="text-sm text-[#64748B]">legal@rentnow.app</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Building2 className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">Bogotá D.C., Colombia</p>
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E2E8F0] dark:border-[#334155] text-center">
          <p className="text-sm text-[#94A3B8]">&copy; {new Date().getFullYear()} RentNow S.A.S. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#1E293B] dark:text-white mb-4">{title}</h2>
      <div className="text-[#475569] dark:text-[#CBD5E1] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
