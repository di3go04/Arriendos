'use client';

import { useInView } from '@/hooks/useInView';
import { useTranslation } from '@/context/I18nContext';
import { motion,useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

// Client-side translation dictionaries for testimonials (not in JSON files since they're testimonial content)
const testimonialTranslations: Record<string, { name: string; role: string; company: string; content: string }[]> = {
  es: [
    {
      name: 'Carlos Méndez',
      role: 'Arrendador',
      company: 'Inmobiliaria Méndez',
      content: 'RentNow me ha permitido gestionar mis 15 propiedades desde un solo lugar. La generación de contratos con IA me ahorra horas cada mes.',
    },
    {
      name: 'Ana Lucía Rojas',
      role: 'Property Manager',
      company: 'Gestión Inmobiliaria SAS',
      content: 'El portal público de propiedades nos ha generado leads calificados semanalmente. La predicción de morosidad es increíble.',
    },
    {
      name: 'Pedro Castillo',
      role: 'Inversor Inmobiliario',
      company: 'Castillo Properties',
      content: 'Los reportes financieros y la exportación a Excel me facilitan la contabilidad. Multi-moneda es perfecto para mis propiedades en Colombia y USA.',
    },
  ],
  en: [
    {
      name: 'Carlos Méndez',
      role: 'Landlord',
      company: 'Méndez Real Estate',
      content: 'RentNow has allowed me to manage my 15 properties from one place. AI contract generation saves me hours every month.',
    },
    {
      name: 'Ana Lucía Rojas',
      role: 'Property Manager',
      company: 'Gestión Inmobiliaria SAS',
      content: 'The public property portal has generated qualified leads for us weekly. The delinquency prediction is incredible.',
    },
    {
      name: 'Pedro Castillo',
      role: 'Real Estate Investor',
      company: 'Castillo Properties',
      content: 'Financial reports and Excel export make accounting easy. Multi-currency is perfect for my properties in Colombia and the USA.',
    },
  ],
  pt: [
    {
      name: 'Carlos Méndez',
      role: 'Proprietário',
      company: 'Imobiliária Méndez',
      content: 'RentNow me permitiu gerenciar minhas 15 propriedades de um só lugar. A geração de contratos com IA me economiza horas a cada mês.',
    },
    {
      name: 'Ana Lucía Rojas',
      role: 'Gestora de Imóveis',
      company: 'Gestión Inmobiliaria SAS',
      content: 'O portal público de propriedades gerou leads qualificados para nós semanalmente. A previsão de inadimplência é incrível.',
    },
    {
      name: 'Pedro Castillo',
      role: 'Investidor Imobiliário',
      company: 'Castillo Properties',
      content: 'Os relatórios financeiros e a exportação para Excel facilitam a contabilidade. Multi-moeda é perfeito para minhas propriedades na Colômbia e nos EUA.',
    },
  ],
  fr: [
    {
      name: 'Carlos Méndez',
      role: 'Propriétaire',
      company: 'Immobilière Méndez',
      content: 'RentNow m\'a permis de gérer mes 15 propriétés depuis un seul endroit. La génération de contrats par IA me fait gagner des heures chaque mois.',
    },
    {
      name: 'Ana Lucía Rojas',
      role: 'Gestionnaire de propriétés',
      company: 'Gestión Inmobiliaria SAS',
      content: 'Le portail public de propriétés nous a généré des prospects qualifiés chaque semaine. La prédiction de défaut de paiement est incroyable.',
    },
    {
      name: 'Pedro Castillo',
      role: 'Investisseur Immobilier',
      company: 'Castillo Properties',
      content: 'Les rapports financiers et l\'exportation vers Excel facilitent la comptabilité. Le multi-devises est parfait pour mes propriétés en Colombie et aux USA.',
    },
  ],
  de: [
    {
      name: 'Carlos Méndez',
      role: 'Vermieter',
      company: 'Immobilien Méndez',
      content: 'RentNow hat es mir ermöglicht, meine 15 Immobilien von einem einzigen Ort aus zu verwalten. Die KI-Vertragserstellung spart mir jeden Monat Stunden.',
    },
    {
      name: 'Ana Lucía Rojas',
      role: 'Immobilienverwalterin',
      company: 'Gestión Inmobiliaria SAS',
      content: 'Das öffentliche Immobilienportal hat uns wöchentlich qualifizierte Interessenten generiert. Die Zahlungsausfallvorhersage ist unglaublich.',
    },
    {
      name: 'Pedro Castillo',
      role: 'Immobilieninvestor',
      company: 'Castillo Properties',
      content: 'Finanzberichte und Excel-Export erleichtern die Buchhaltung. Multi-Währung ist perfekt für meine Immobilien in Kolumbien und den USA.',
    },
  ],
  it: [
    {
      name: 'Carlos Méndez',
      role: 'Proprietario',
      company: 'Immobiliare Méndez',
      content: 'RentNow mi ha permesso di gestire le mie 15 proprietà da un unico posto. La generazione di contratti con IA mi fa risparmiare ore ogni mese.',
    },
    {
      name: 'Ana Lucía Rojas',
      role: 'Gestrice Immobiliare',
      company: 'Gestión Inmobiliaria SAS',
      content: 'Il portale pubblico delle proprietà ci ha generato contatti qualificati ogni settimana. La previsione dell\'insolvenza è incredibile.',
    },
    {
      name: 'Pedro Castillo',
      role: 'Investitore Immobiliare',
      company: 'Castillo Properties',
      content: 'I report finanziari e l\'esportazione in Excel facilitano la contabilità. Il multi-valuta è perfetto per le mie proprietà in Colombia e negli USA.',
    },
  ],
};

// Section header translations
const sectionHeaders: Record<string, { badge: string; title: string; highlight: string }> = {
  es: { badge: 'Testimonios', title: 'Lo que dicen nuestros ', highlight: 'usuarios' },
  en: { badge: 'Testimonials', title: 'What our ', highlight: 'users say' },
  pt: { badge: 'Depoimentos', title: 'O que dizem nossos ', highlight: 'usuários' },
  fr: { badge: 'Témoignages', title: 'Ce que disent nos ', highlight: 'utilisateurs' },
  de: { badge: 'Erfahrungsberichte', title: 'Was unsere ', highlight: 'Nutzer sagen' },
  it: { badge: 'Testimonianze', title: 'Cosa dicono i nostri ', highlight: 'utenti' },
};

function TestimonialCard({ t, index, inView }: { t: { name: string; role: string; company: string; content: string }; index: number; inView: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.12, ease: 'easeOut' }}
      className="bg-white rounded-card p-6 border border-[#e6edf5] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star key={j} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
        ))}
      </div>
      <p className="text-sm text-[#475569] leading-relaxed mb-6">
        &ldquo;{t.content}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-[#e6edf5]">
        <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-sm">
          {t.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-[#1e293b]">{t.name}</p>
          <p className="text-xs text-[#64748b]">{t.role} &middot; {t.company}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05, once: true });
  const { locale } = useTranslation();
  const testimonials = testimonialTranslations[locale] || testimonialTranslations['es'];
  const header = sectionHeaders[locale] || sectionHeaders['es'];

  return (
    <section ref={ref} className="relative py-20 md:py-28 bg-gradient-to-b from-[#f8fafc] to-white">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-[0.2em]">{header.badge}</span>
          <h2 className="font-display font-bold text-[#1e3a5f] text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mt-3 mb-4">
            {header.title}<span className="text-[#f59e0b]">{header.highlight}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} t={t} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
