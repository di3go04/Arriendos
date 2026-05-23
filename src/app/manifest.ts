import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RentNow - Gestión Inteligente de Arriendos',
    short_name: 'RentNow',
    description: 'Plataforma profesional para la gestión inteligente de arrendamientos',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F6F9',
    theme_color: '#1E3A5F',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    categories: ['business', 'finance', 'productivity'],
    orientation: 'portrait-primary',
    lang: 'es-CO',
    dir: 'ltr',
  };
}