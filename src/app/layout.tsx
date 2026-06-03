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
import { Inter, Poppins, Noto_Sans, Noto_Sans_SC, Noto_Sans_JP, Noto_Sans_KR, Noto_Sans_Arabic, Noto_Sans_Hebrew } from 'next/font/google';

/**
 * Inter: primary sans-serif font.
 * Extended subsets cover Latin Extended (French, German, Spanish, Portuguese, etc.),
 * Cyrillic (Russian, Bulgarian), Cyrillic Extended, and Greek.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

/**
 * Poppins: display/heading font.
 * Latin-ext covers accents for EU languages.
 */
const poppins = Poppins({
  weight: ['400', '700', '900'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

/**
 * Noto Sans: catch-all fallback for scripts not covered by Inter/Poppins.
 * Lightweight — only loaded when browser requests those characters.
 */
const notoSans = Noto_Sans({
  weight: ['400', '700'],
  subsets: ['cyrillic', 'cyrillic-ext', 'devanagari', 'greek', 'greek-ext', 'latin', 'latin-ext', 'vietnamese'],
  variable: '--font-noto',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

/**
 * CJK fallback fonts — loaded on-demand, only when text contains CJK chars.
 * Each is ~4MB gzipped, so we defer loading.
 */
const notoSansSC = Noto_Sans_SC({
  weight: ['400', '700'],
  variable: '--font-cjk-sc',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '700'],
  variable: '--font-cjk-jp',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

const notoSansKR = Noto_Sans_KR({
  weight: ['400', '700'],
  variable: '--font-cjk-kr',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

const notoSansHebrew = Noto_Sans_Hebrew({
  weight: ['400', '700'],
  variable: '--font-hebrew',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

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
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${notoSans.variable} ${notoSansSC.variable} ${notoSansJP.variable} ${notoSansKR.variable} ${notoSansArabic.variable} ${notoSansHebrew.variable}`}
    >
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