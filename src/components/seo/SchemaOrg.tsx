export function SchemaOrg() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Rentnow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Plataforma profesional para la gestión de arrendamientos, contratos, pagos e inquilinos.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://rentnow.app',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '24',
      offerCount: '3',
    },
    author: {
      '@type': 'Organization',
      name: 'Rentnow',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
