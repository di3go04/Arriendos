import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import { GeistSans } from 'geist/font'
import { AuthProvider } from '@/context/AuthContext'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import { ThemeProvider } from '@/components/ThemeProvider'
import { cookies, headers } from 'next/headers'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://rentnow.app'),
  title: { default: 'RentNow | Gestión Profesional de Arrendamientos', template: '%s | RentNow' },
  description: 'Plataforma profesional para la gestión de arrendamientos, contratos, pagos e inquilinos. Open Banking, KYC, Voice Agents y más.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  },
  openGraph: {
    title: 'RentNow – Gestión de arrendamientos',
    description: 'Plataforma de gestión de arrendamientos con KYC, pagos y asistentes de voz.',
    url: 'https://rentnow.app',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
}

async function loadMessages(locale: string) {
  try {
    const data = await import(`../messages/${locale}.json`)
    return data.default
  } catch {
    const data = await import(`../messages/es.json`)
    return data.default
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('RentNow_locale')?.value || 'es'
  const messages = await loadMessages(locale)
  const nonce = (await headers()).get('x-nonce') || ''

  return (
    <html lang={locale} className={GeistSans.variable} suppressHydrationWarning nonce={nonce}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SessionProviderWrapper>
              <AuthProvider>{children}</AuthProvider>
            </SessionProviderWrapper>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
