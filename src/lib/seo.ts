export function propertyJsonLd(property: {
  title: string;
  description?: string;
  address?: string;
  city?: string;
  price?: number;
  currency?: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: property.description || `${property.title} en arriendo`,
    url: property.url,
    image: property.image || '/og-image.png',
    offers: {
      '@type': 'Offer',
      price: property.price || 0,
      priceCurrency: property.currency || 'COP',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
