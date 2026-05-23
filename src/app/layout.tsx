import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaInit } from '@/components/modules/PwaInit';
import PostHogProvider from '@/components/PostHogProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { defaultLocale, locales } from '@/i18n/config';
import { getMessages } from '@/i18n/request';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { ConsentBanner } from '@/modules/gdpr';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://rentnow.app'),
  title: {
    default: 'Rentnow | Gestión Profesional de Arrendamientos',
    template: '%s | Rentnow',
  },
  description:
    'Plataforma profesional para la gestión de arrendamientos, contratos, pagos e inquilinos.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1E3A5F',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const headerLocale = headerStore.get('x-locale');
  const cookieLocale = cookieStore.get('RentNow_locale')?.value;
  const locale = locales.includes(headerLocale as any)
    ? headerLocale!
    : locales.includes(cookieLocale as any)
      ? cookieLocale!
      : defaultLocale;
  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <I18nProvider locale={locale} messages={messages}>
            <ThemeProvider>
              <AuthProvider>
                <PwaInit />
                <PostHogProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </PostHogProvider>
                <ConsentBanner />
              </AuthProvider>
            </ThemeProvider>
          </I18nProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
