import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; " +
              "script-src 'self' https://app.posthog.com https://cdn.posthog.com https://us-assets.i.posthog.com https://unpkg.com 'unsafe-eval' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
              "connect-src 'self' https://*.supabase.co https://*.posthog.com https://app.posthog.com https://us-assets.i.posthog.com; " +
              "img-src 'self' data: https://*.supabase.co https://*.posthog.com https://cdn.jsdelivr.net https://www.mercadopago.com; " +
              "font-src 'self'; " +
              "frame-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);