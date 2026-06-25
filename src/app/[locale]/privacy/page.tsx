'use client';

import { ArrowLeft, Building2, Mail, Shield } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function PrivacyPage() {
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
            <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] dark:text-white">Privacy Policy</h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Last updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-8">
          <Section title="1. Data Controller">
            <p><strong>RentNow S.A.S.</strong> is the data controller responsible for the processing of your personal data.</p>
            <div className="flex items-center gap-2 text-sm text-[#64748B] mt-2">
              <Mail className="w-4 h-4" /> privacy@rentnow.app
            </div>
          </Section>

          <Section title="2. Data We Collect">
            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">2.1 Registration Information</h4>
            <ul>
              <li>Full name, email address, phone number</li>
              <li>Role (landlord / tenant)</li>
              <li>Preferred currency and language settings</li>
            </ul>
            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">2.2 Property and Contract Information</h4>
            <ul>
              <li>Address, type, area, and features of properties</li>
              <li>Tenant data (name, ID, contact)</li>
              <li>Contract terms and rental amounts</li>
            </ul>
            <h4 className="font-semibold text-[#1E293B] dark:text-white mt-4">2.3 Payment Information</h4>
            <ul>
              <li>Payment methods (securely processed by Stripe and Mercado Pago)</li>
              <li>Transaction history and payment status</li>
              <li>Subscription and billing information</li>
            </ul>
          </Section>

          <Section title="3. Purposes of Processing">
            <ul>
              <li>Provide the rental management service</li>
              <li>Process payments and subscriptions</li>
              <li>Generate contracts and legal documents</li>
              <li>Send notifications and reminders</li>
              <li>Improve the platform and user experience</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <ul>
              <li><strong>Stripe Inc.</strong> — Payment processing (PCI-DSS)</li>
              <li><strong>Mercado Pago</strong> — LATAM payment processing (PCI-DSS)</li>
              <li><strong>Vercel Inc.</strong> — Hosting and infrastructure (DPA)</li>
            </ul>
          </Section>

          <Section title="5. Your Rights">
            <p>You have the right to access, rectify, cancel, or oppose the processing of your personal data. To exercise your rights, write to <strong>privacy@rentnow.app</strong>.</p>
          </Section>

          <Section title="6. Contact">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">Data Protection Officer</p>
                <p className="text-sm text-[#64748B]">privacy@rentnow.app</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Building2 className="w-5 h-5 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold text-[#1E293B] dark:text-white">RentNow S.A.S.</p>
                <p className="text-sm text-[#64748B]">Bogotá D.C., Colombia</p>
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
