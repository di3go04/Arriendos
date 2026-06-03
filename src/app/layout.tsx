import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaInit } from '@/components/modules/PwaInit';
import PostHogProvider from '@/components/PostHogProvider';
import { SchemaOrg } from '@/components/seo/SchemaOrg';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { defaultLocale, locales } from '@/i18n/config';
import { getMessages } from '@/i18n/request';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { ConsentBanner } from '@/modules/gdpr';
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const poppins = Poppins({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-display', display: 'swap' });

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
  const locale = locales.includes(headerLocale as typeof locales[number])
    ? headerLocale!
    : locales.includes(cookieLocale as typeof locales[number])
      ? cookieLocale!
      : defaultLocale;
  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <SchemaOrg />
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
