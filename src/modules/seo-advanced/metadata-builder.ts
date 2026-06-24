import type { Metadata } from 'next';

const LOCALES = ['es', 'en', 'fr', 'pt', 'it', 'de'] as const;

/** Módulo 9 — metadata con hreflang y schema base */
export function buildLocalizedMetadata(opts: {
  title: string;
  description: string;
  path: string;
  locale?: string;
  type?: 'website' | 'article';
}): Metadata {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://rentnow.app';
  const path = opts.path.startsWith('/') ? opts.path : `/${opts.path}`;

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${base}/${loc}${path === '/' ? '' : path}`;
  }

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: `${base}${path}`,
      languages,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      type: opts.type || 'website',
      url: `${base}${path}`,
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': opts.type === 'article' ? 'Article' : 'WebPage',
        name: opts.title,
        description: opts.description,
        url: `${base}${path}`,
      }),
    },
  };
}
