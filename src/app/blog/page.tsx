import { buildLocalizedMetadata } from '@/modules/seo-advanced/metadata-builder';
import Link from 'next/link';

export const metadata = buildLocalizedMetadata({
  title: 'Blog y Recursos | RentNow',
  description: 'Aprende las mejores prácticas para gestionar tus propiedades y arriendos.',
  path: '/blog',
});

const POSTS = [
  {
    slug: 'como-redactar-contrato-arrendamiento',
    title: 'Cómo redactar un contrato de arrendamiento blindado en 2026',
    excerpt: 'Descubre las 5 cláusulas indispensables que todo contrato de alquiler debe tener para evitar problemas legales y asegurar tus ingresos.',
    date: '12 May 2026',
    category: 'Legal',
    readTime: '5 min'
  },
  {
    slug: 'predecir-morosidad-inteligencia-artificial',
    title: 'Prediciendo la morosidad: Cómo la IA está cambiando el sector inmobiliario',
    excerpt: 'La tecnología avanza y ahora es posible saber con un 95% de precisión si un inquilino fallará en sus pagos antes de firmar.',
    date: '08 May 2026',
    category: 'Tecnología',
    readTime: '4 min'
  },
  {
    slug: 'guia-cobros-whatsapp',
    title: 'Guía: Automatizar cobros de renta por WhatsApp',
    excerpt: 'El email está muerto para la cobranza. Aprende cómo configurar recordatorios automáticos por WhatsApp y reduce tu cartera vencida a cero.',
    date: '01 May 2026',
    category: 'Gestión',
    readTime: '7 min'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-5xl mb-4">
            Recursos Inmobiliarios
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Estrategias, guías legales y tecnología para llevar la administración de tus propiedades al siguiente nivel.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <article key={post.slug} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4 text-xs font-medium">
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full">
                    {post.category}
                  </span>
                  <span className="text-neutral-500">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-500">{post.date}</span>
                  <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-primary hover:underline">
                    Leer más →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
