import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { I18nProvider } from '@/context/I18nContext';
import { locales } from '@/i18n/config';
import { getMessages } from '@/i18n/request';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { SuppressWarnings } from '@/lib/suppress-warnings';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as typeof locales[number])) notFound();

  const messages = await getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <I18nProvider locale={locale} messages={messages}>
        <SuppressWarnings />
        <ToastProvider>
          {children}
        </ToastProvider>
      </I18nProvider>
    </NextIntlClientProvider>
  );
}
